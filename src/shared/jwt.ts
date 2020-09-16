import {
  JWT_KEY_FILE_PATH,
  JWT_ALGORITHM,
  JWT_EXPIRES_IN,
  JWT_KEY,
  JWT_CLAIMS_NAMESPACE,
  DEFAULT_USER_ROLE,
  DEFAULT_ANONYMOUS_ROLE,
  JWT_CUSTOM_FIELDS
} from './config'
import { JWK, JWKS, JWT } from 'jose'

import Boom from '@hapi/boom'
import fs from 'fs'
import kebabCase from 'lodash.kebabcase'
import { Claims, Token, AccountData, ClaimValueType } from './types'

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
 * Create an object that contains all the permission variables of the user,
 * i.e. user-id, allowed-roles, default-role and the kebab-cased columns
 * of the public.tables columns defined in JWT_CUSTOM_FIELDS
 * @param jwt if true, add a 'x-hasura-' prefix to the property names, and stringifies the values (required by Hasura)
 */
export function generatePermissionVariables(
  { default_role, account_roles = [], user }: AccountData,
  jwt = false
): { [key: string]: ClaimValueType } {
  const prefix = jwt ? 'x-hasura-' : ''
  const role = user.is_anonymous ? DEFAULT_ANONYMOUS_ROLE : default_role || DEFAULT_USER_ROLE
  const accountRoles = account_roles.map(({ role: roleName }) => roleName)

  if (!accountRoles.includes(role)) {
    accountRoles.push(role)
  }

  return {
    [`${prefix}user-id`]: user.id,
    [`${prefix}allowed-roles`]: accountRoles,
    [`${prefix}default-role`]: role,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...JWT_CUSTOM_FIELDS.reduce<{ [key: string]: ClaimValueType }>((aggr: any, cursor) => {
      aggr[`${prefix}${kebabCase(cursor)}`] = jwt
        ? typeof user[cursor] === 'string'
          ? user[cursor]
          : JSON.stringify(user[cursor] ?? null)
        : user[cursor]
      return aggr
    }, {})
  }
}

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

/**
 * Create JWT token.
 */
export const createHasuraJwt = (accountData: AccountData): string =>
  sign({
    [JWT_CLAIMS_NAMESPACE]: generatePermissionVariables(accountData, true)
  })
