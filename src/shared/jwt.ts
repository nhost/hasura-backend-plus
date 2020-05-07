import {
  JWT_KEY_FILE_PATH,
  COOKIE_SECRET,
  JWT_ALGORITHM,
  JWT_EXPIRES_IN,
  JWT_KEY,
  JWT_CLAIMS_NAMESPACE,
  JWT_REFRESH_EXPIRES_IN,
  DEFAULT_USER_ROLE,
  DEFAULT_ANONYMOUS_ROLE,
  JWT_CUSTOM_FIELDS
} from './config'
import { JWK, JWKS, JWT } from 'jose'

import Boom from '@hapi/boom'
import { Response } from 'express'
import fs from 'fs'
import { insertRefreshToken } from './queries'
import { request } from './request'
import { v4 as uuidv4 } from 'uuid'
import kebabCase from 'lodash.kebabcase'
import { Claims, Token, AccountData, ClaimValueType } from './types'

interface InsertRefreshTokenData {
  insert_auth_refresh_tokens_one: {
    account: AccountData
  }
}

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
 * New refresh token expiry date.
 */
export function newRefreshExpiry(): number {
  const now = new Date()
  const days = JWT_REFRESH_EXPIRES_IN / 1440

  return now.setDate(now.getDate() + days)
}

/**
 * Set refresh token as a cookie
 * @param res Express Response
 * @param refresh_token Refresh token to be set
 */
export const setCookie = (
  res: Response,
  refresh_token: string,
  permission_variables: string
): void => {
  // converting JWT_REFRESH_EXPIRES_IN from minutes to milliseconds
  const maxAge = JWT_REFRESH_EXPIRES_IN * 60 * 1000

  // set refresh token as cookie
  res.cookie('refresh_token', refresh_token, {
    httpOnly: true,
    maxAge,
    signed: Boolean(COOKIE_SECRET)
  })

  // set permission variables cookie
  res.cookie('permission_variables', permission_variables, {
    httpOnly: true,
    maxAge,
    signed: Boolean(COOKIE_SECRET)
  })
}

/**
 * Insert new refresh token in database and set new refresh token as cookie.
 * @param res Express Response
 * @param accountId Account ID
 * @param refresh_token (optional) Refresh token to be set
 */
export const setRefreshToken = async (
  res: Response,
  accountId: string,
  refresh_token?: string
): Promise<void> => {
  if (!refresh_token) {
    refresh_token = uuidv4()
  }

  const insert_account_data = (await request(insertRefreshToken, {
    refresh_token_data: {
      account_id: accountId,
      refresh_token,
      expires_at: new Date(newRefreshExpiry())
    }
  })) as InsertRefreshTokenData

  const { account } = insert_account_data.insert_auth_refresh_tokens_one

  const permission_variables = JSON.stringify(generatePermissionVariables(account))

  setCookie(res, refresh_token, permission_variables)
}

/**
 * Create JWT token.
 */
export const createHasuraJwt = (accountData: AccountData): string =>
  sign({
    [JWT_CLAIMS_NAMESPACE]: generatePermissionVariables(accountData, true)
  })
