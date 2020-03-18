import { JWK, JWKS, JWT } from 'jose'

import Boom from '@hapi/boom'
import fs from 'fs'
import path from 'path'

const RSA_TYPES = ['RS256', 'RS384', 'RS512']
const SHA_TYPES = ['HS256', 'HS384', 'HS512']

const jwtAlgorithm = process.env.JWT_ALGORITHM || 'RS256'
let jwtKey: string | JWK.RSAKey | JWK.ECKey | JWK.OKPKey | JWK.OctKey = process.env
  .JWT_SECRET_KEY as string

/**
 * * Sets the JWT Key.
 * * If RSA algorithm, then checks if the PEM has been passed on through the JWT_SECRET_KEY
 * * If not, tries to read the private.pem file, or generates it otherwise
 * * If SHA algorithm, then uses the JWT_SECRET_KEY environment variables
 */
const KEY_FILE_PATH = path.resolve(process.env.PWD || '.', 'keys/private.pem')
if (RSA_TYPES.includes(jwtAlgorithm)) {
  if (jwtKey)
    try {
      jwtKey = JWK.asKey(jwtKey, { alg: jwtAlgorithm })
      jwtKey.toPEM(true)
    } catch (error) {
      throw Boom.badImplementation(
        `Invalid RSA private key in the JWT_SECRET_KEY environment variable.`
      )
    }
  else
    try {
      const file = fs.readFileSync(KEY_FILE_PATH)
      jwtKey = JWK.asKey(file)
    } catch (error) {
      jwtKey = JWK.generateSync('RSA', 2048, { alg: jwtAlgorithm, use: 'sig' }, true)
      fs.writeFileSync(KEY_FILE_PATH, jwtKey.toPEM(true))
    }
} else if (SHA_TYPES.includes(jwtAlgorithm)) {
  if (!jwtKey) throw Boom.badImplementation(`Empty JWT secret key.`)
} else throw Boom.badImplementation(`Invalid JWT algorithm: ${jwtAlgorithm}`)

const jwtExpiresIn = parseInt(process.env.JWT_EXPIRES_IN as string, 10) || 15
export const newJwtExpiry = jwtExpiresIn * 60 * 1000

/**
 * * Creates a JWKS store. Only works with RSA algorithms. Raises an error otherwise
 * @returns JWKS store
 */
export const getJwkStore = (): JWKS.KeyStore => {
  if (RSA_TYPES.includes(jwtAlgorithm)) {
    const keyStore = new JWKS.KeyStore()
    keyStore.add(jwtKey as JWK.RSAKey)
    return keyStore
  }
  throw Boom.notImplemented('JWKS is not implemented on this server.')
}

/**
 * * Signs a payload with the existing JWT configuration
 */
export const sign = (payload: object): string =>
  JWT.sign(payload, jwtKey, {
    algorithm: jwtAlgorithm,
    expiresIn: `${jwtExpiresIn}m`
  })

/**
 * Claims interface.
 */
export interface Claims {
  'x-hasura-user-id': string
  'x-hasura-default-role': string
  'x-hasura-allowed-roles': string[]
  [key: string]: string | string[]
}

/**
 * Token interface.
 */
interface Token {
  'https://hasura.io/jwt/claims': Claims
  exp: bigint
  iat: bigint
}

/**
 * Verify JWT token.
 * @param authorization Authorization header.
 */
export function verify(authorization: string | undefined): Token {
  try {
    if (!authorization) {
      throw Boom.unauthorized('Missing Authorization header')
    }
    const token = authorization.replace('Bearer ', '')
    return JWT.verify(token, jwtKey) as Token
  } catch (err) {
    throw Boom.unauthorized('Invalid or expired JWT token.')
  }
}
