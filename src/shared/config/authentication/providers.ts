import Boom from '@hapi/boom'
import { castBooleanEnv } from '../utils'
import { REDIRECT_URL_SUCCESS, REDIRECT_URL_ERROR } from '../application'

/**
 * * OAuth settings
 */
export const {
  // External OAuth provider redirect URLS
  PROVIDER_SUCCESS_REDIRECT = REDIRECT_URL_SUCCESS,
  PROVIDER_FAILURE_REDIRECT = REDIRECT_URL_ERROR
} = process.env

const PROVIDERS: Record<string, Record<string, string | undefined>> = {}

// Github OAuth2 provider settings
if (castBooleanEnv('GITHUB_ENABLE')) {
  PROVIDERS.github = {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    authorizationURL: process.env.GITHUB_AUTHORIZATION_URL, // optional
    tokenURL: process.env.GITHUB_TOKEN_URL, // optional
    userProfileURL: process.env.GITHUB_USER_PROFILE_URL // optional
  }
}

// Google OAuth2 provider settings
if (castBooleanEnv('GOOGLE_ENABLE')) {
  PROVIDERS.google = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET
  }
}

// Google OAuth2 provider settings
if (castBooleanEnv('FACEBOOK_ENABLE')) {
  PROVIDERS.facebook = {
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET
  }
}

// Twitter provider settings
if (castBooleanEnv('TWITTER_ENABLE')) {
  PROVIDERS.twitter = {
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET
  }
}
// LinkedIn OAuth2 provider settings
if (castBooleanEnv('LINKEDIN_ENABLE')) {
  PROVIDERS.linkedin = {
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET
  }
}

// Apple OAuth2 provider settings
if (castBooleanEnv('APPLE_ENABLE')) {
  try {
    PROVIDERS.apple = {
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID,
      key:
        process.env.APPLE_PRIVATE_KEY &&
        // Convert contents from base64 string to string to avoid issues with line breaks in the environment variable
        Buffer.from(process.env.APPLE_PRIVATE_KEY, 'base64').toString('ascii')
    }
  } catch (e) {
    throw Boom.badImplementation(`Invalid Apple OAuth Key file.`)
  }
}

// Microsoft Windows Live SSO provider settings
if (castBooleanEnv('WINDOWS_LIVE_ENABLE')) {
  PROVIDERS.windowslive = {
    clientID: process.env.WINDOWS_LIVE_CLIENT_ID,
    clientSecret: process.env.WINDOWS_LIVE_CLIENT_SECRET
  }
}

export { PROVIDERS }

// True if at least one of the providers is enabled
export const AUTH_HAS_ONE_PROVIDER = !!Object.keys(PROVIDERS).length
