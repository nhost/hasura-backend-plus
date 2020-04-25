import {
  JWT_KEY_FILE_PATH,
  COOKIE_SECRET,
  JWT_ALGORITHM,
  JWT_EXPIRES_IN,
  JWT_KEY,
  JWT_CLAIMS_NAMESPACE
} from './config'
import { JWK, JWKS, JWT } from 'jose'

import Boom from '@hapi/boom'
import { Response } from 'express'
import fs from 'fs'
import { insertRefreshToken } from './queries'
import { newRefreshExpiry } from './helpers'
import { request } from './request'
import { v4 as uuidv4 } from 'uuid'

const RSA_TYPES = ['RS256', 'RS384', 'RS512']
const SHA_TYPES = ['HS256', 'HS384', 'HS512']

let jwtKey: string | JWK.RSAKey | JWK.ECKey | JWK.OKPKey | JWK.OctKey = JWT_KEY as string

/**
 * * Sets the JWT Key.
 * * If RSA algorithm, then checks if the PEM has been passed on through the JWT_KEY
 * * If not, tries to read the private.pem file, or generates it otherwise
 * * If SHA algorithm, then uses the JWT_KEY environment variables
 */
if (RSA_TYPES.includes(JWT_ALGORITHM)) {
  if (jwtKey) {
    try {
      jwtKey = JWK.asKey(jwtKey, { alg: JWT_ALGORITHM })
      jwtKey.toPEM(true)
    } catch (error) {
      throw Boom.badImplementation('Invalid RSA private key in the JWT_KEY environment variable.')
    }
  } else {
    try {
      const file = fs.readFileSync(JWT_KEY_FILE_PATH)
      jwtKey = JWK.asKey(file)
    } catch (error) {
      jwtKey = JWK.generateSync('RSA', 2048, { alg: JWT_ALGORITHM, use: 'sig' }, true)
      fs.writeFileSync(JWT_KEY_FILE_PATH, jwtKey.toPEM(true))
    }
  }
} else if (SHA_TYPES.includes(JWT_ALGORITHM)) {
  if (!jwtKey) {
    throw Boom.badImplementation('Empty JWT secret key.')
  }
} else {
  throw Boom.badImplementation(`Invalid JWT algorithm: ${JWT_ALGORITHM}`)
}

export const newJwtExpiry = JWT_EXPIRES_IN * 60 * 1000

/**
 * * Creates a JWKS store. Only works with RSA algorithms. Raises an error otherwise
 * @returns JWKS store
 */
export const getJwkStore = (): JWKS.KeyStore => {
  if (RSA_TYPES.includes(JWT_ALGORITHM)) {
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
    algorithm: JWT_ALGORITHM,
    expiresIn: `${JWT_EXPIRES_IN}m`
  })

export type ClaimValueType =
  | string
  | string[]
  | number
  | number[]
  | RegExp
  | RegExp[]
  | boolean
  | boolean[]
  | undefined

/**
 * Claims interface.
 */
export interface Claims {
  'x-hasura-user-id': string
  'x-hasura-default-role': string
  'x-hasura-allowed-roles': string[]
  [key: string]: ClaimValueType
}

/**
 * Token interface.
 */
export type Token = {
  [key: string]: Claims
} & {
  exp: bigint
  iat: bigint
}

/**
 * Verify JWT token and return the Hasura claims.
 * @param authorization Authorization header.
 */
export const getClaims = (authorization: string | undefined): Claims => {
  if (!authorization) throw Boom.unauthorized('Missing Authorization header.')
  const token = authorization.replace('Bearer ', '')
  try {
    const decodedToken = JWT.verify(token, jwtKey) as Token
    if (!decodedToken[JWT_CLAIMS_NAMESPACE]) throw Boom.unauthorized('Claims namespace not found.')
    return decodedToken[JWT_CLAIMS_NAMESPACE]
  } catch (err) {
    throw Boom.unauthorized('Invalid or expired JWT token.')
  }
}

export const setRefreshToken = async (
  response: Response,
  accountId: string,
  refresh_token?: string
): Promise<void> => {
  if (!refresh_token) {
    refresh_token = uuidv4()
  }
  await request(insertRefreshToken, {
    refresh_token_data: {
      account_id: accountId,
      refresh_token,
      expires_at: new Date(newRefreshExpiry())
    }
  })
  // set refresh token as cookie
  response.cookie('refresh_token', refresh_token, {
    httpOnly: true,
    maxAge: newRefreshExpiry(),
    signed: Boolean(COOKIE_SECRET),
    expires: new Date(newRefreshExpiry())
  })
}
