import Boom from '@hapi/boom'
import path from 'path'
import { castBooleanEnv, castStringArrayEnv, castIntEnv } from './utils'
import { REDIRECT_URL_SUCCESS, REDIRECT_URL_ERROR } from './application'

/**
 * * Authentication settings
 */
export const {
  COOKIE_SECRET,
  JWT_SECRET_KEY,
  AUTH_OTP_ISSUER = 'HBP',
  ALLOWED_EMAIL_DOMAINS,
  JWT_ALGORITHM = 'RS256',
  AUTH_DEFAULT_ROLE = 'user'
} = process.env
export const AUTH_ENABLE = castBooleanEnv('AUTH_ENABLE', true)
export const AUTH_AUTO_ACTIVATE_NEW_USERS = castBooleanEnv('AUTH_AUTO_ACTIVATE_NEW_USERS')
export const AUTH_CLAIMS_FIELDS = castStringArrayEnv('AUTH_CLAIMS_FIELDS')
export const AUTH_HIBP_ENABLE = castBooleanEnv('AUTH_HIBP_ENABLE')
export const AUTH_KEY_FILE_PATH = path.resolve(process.env.PWD || '.', 'custom/keys/private.pem')
export const AUTH_REGISTRATION_FIELDS = castStringArrayEnv('AUTH_REGISTRATION_FIELDS')
export const REFRESH_EXPIRES_IN = castIntEnv('REFRESH_EXPIRES_IN', 43200)
export const JWT_EXPIRES_IN = castIntEnv('JWT_EXPIRES_IN', 15)
export const MIN_PASSWORD_LENGTH = castIntEnv('MIN_PASSWORD_LENGTH', 3)

// Multi-Factor Authentication configuration
export const AUTH_MFA_ENABLE = castBooleanEnv('AUTH_MFA_ENABLE', true)

/**
 * * OAuth settings
 */
export const {
  // External OAuth provider redirect URLS
  PROVIDERS_SUCCESS_REDIRECT = REDIRECT_URL_SUCCESS,
  PROVIDERS_FAILURE_REDIRECT = REDIRECT_URL_ERROR
} = process.env

const AUTH_PROVIDERS: Record<string, Record<string, string | undefined>> = {}

// Github OAuth2 provider settings
if (castBooleanEnv('AUTH_GITHUB_ENABLE')) {
  AUTH_PROVIDERS.github = {
    clientID: process.env.AUTH_GITHUB_CLIENT_ID,
    clientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET,
    authorizationURL: process.env.AUTH_GITHUB_AUTHORIZATION_URL, // optional
    tokenURL: process.env.AUTH_GITHUB_TOKEN_URL, // optional
    userProfileURL: process.env.AUTH_GITHUB_USER_PROFILE_URL // optional
  }
}

// Google OAuth2 provider settings
if (castBooleanEnv('AUTH_GOOGLE_ENABLE')) {
  AUTH_PROVIDERS.google = {
    clientID: process.env.AUTH_GOOGLE_CLIENT_ID,
    clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET
  }
}

// LinkedIn OAuth2 provider settings
if (castBooleanEnv('AUTH_LINKEDIN_ENABLE')) {
  AUTH_PROVIDERS.linkedin = {
    clientID: process.env.AUTH_LINKEDIN_CLIENT_ID,
    clientSecret: process.env.AUTH_LINKEDIN_CLIENT_SECRET
  }
}

// Apple OAuth2 provider settings
if (castBooleanEnv('AUTH_APPLE_ENABLE')) {
  try {
    AUTH_PROVIDERS.apple = {
      clientID: process.env.AUTH_APPLE_CLIENT_ID,
      teamID: process.env.AUTH_APPLE_TEAM_ID,
      keyID: process.env.AUTH_APPLE_KEY_ID,
      key:
        process.env.AUTH_APPLE_PRIVATE_KEY &&
        // Convert contents from base64 string to string to avoid issues with line breaks in the environment variable
        Buffer.from(process.env.AUTH_APPLE_PRIVATE_KEY, 'base64').toString('ascii')
    }
  } catch (e) {
    throw Boom.badImplementation(`Invalid Apple OAuth Key file.`)
  }
}

export { AUTH_PROVIDERS }

// True if at least one of the providers is enabled
export const AUTH_HAS_ONE_PROVIDER = !!Object.keys(AUTH_PROVIDERS).length
