import Boom from '@hapi/boom'
import { castBooleanEnv } from '../utils'
import { APPLICATION } from '../application'

/**
 * * OAuth settings
 */
export const REDIRECT = {
  get PROVIDER_SUCCESS() {
    return process.env.PROVIDER_SUCCESS_REDIRECT || APPLICATION.REDIRECT_URL_SUCCESS
  },
  get PROVIDER_FAILURE() {
    return process.env.PROVIDER_FAILURE_REDIRECT || APPLICATION.REDIRECT_URL_ERROR
  }
}

const PROVIDERS: Record<string, Record<string, string | undefined> | null> = {}

// Github OAuth2 provider settings
Object.defineProperty(PROVIDERS, 'github', {
  get: () => !castBooleanEnv('GITHUB_ENABLE') ? null : {
    get clientID() {
      return process.env.GITHUB_CLIENT_ID
    },
    get clientSecret() {
      return process.env.GITHUB_CLIENT_SECRET
    },
    get authorizationURL() {
      return process.env.GITHUB_AUTHORIZATION_URL
    },
    get tokenURL() {
      return process.env.GITHUB_TOKEN_URL
    },
    get userProfileURL() {
      return process.env.GITHUB_USER_PROFILE_URL
    }
  }
})

// Google OAuth2 provider settings
Object.defineProperty(PROVIDERS, 'google', {
  get: () => !castBooleanEnv('GOOGLE_ENABLE') ? null : {
    get clientID() {
      return process.env.GITHUB_CLIENT_ID
    },
    get clientSecret() {
      return process.env.GITHUB_CLIENT_SECRET
    },
  }
})

// Google OAuth2 provider settings
Object.defineProperty(PROVIDERS, 'facebook', {
  get: () => !castBooleanEnv('FACEBOOK_ENABLE') ? null : {
    get clientID() {
      return process.env.FACEBOOK_CLIENT_ID
    },
    get clientSecret() {
      return process.env.FACEBOOK_CLIENT_SECRET
    },
  }
})

// Twitter provider settings
Object.defineProperty(PROVIDERS, 'twitter', {
  get: () => !castBooleanEnv('TWITTER_ENABLE') ? null : {
    get consumerKey() {
      return process.env.TWITTER_CONSUMER_KEY
    },
    get consumerSecret() {
      return process.env.TWITTER_CONSUMER_SECRET
    },
  }
})

// LinkedIn OAuth2 provider settings
Object.defineProperty(PROVIDERS, 'linkedin', {
  get: () => !castBooleanEnv('LINKEDIN_ENABLE') ? null : {
    get clientID() {
      return process.env.LINKEDIN_CLIENT_ID
    },
    get clientSecret() {
      return process.env.LINKEDIN_CLIENT_SECRET
    },
  }
})

// Apple OAuth2 provider settings
Object.defineProperty(PROVIDERS, 'apple', {
  get: () => {
    if (!castBooleanEnv('APPLE_ENABLE')) return null;
    try {
      PROVIDERS.apple = {
        get clientID() {
          return process.env.APPLE_CLIENT_ID
        },
        get teamID() {
          return process.env.APPLE_TEAM_ID
        },
        get keyID() {
          return process.env.APPLE_KEY_ID
        },
        get key() {
          return process.env.APPLE_PRIVATE_KEY &&
          // Convert contents from base64 string to string to avoid issues with line breaks in the environment variable
          Buffer.from(process.env.APPLE_PRIVATE_KEY, 'base64').toString('ascii')
        }
      }
    } catch (e) {
      throw Boom.badImplementation(`Invalid Apple OAuth Key file.`)
    }
  }
})

// Microsoft Windows Live SSO provider settings
Object.defineProperty(PROVIDERS, 'windowslive', {
  get: () => !castBooleanEnv('WINDOWS_LIVE_ENABLE') ? null : {
    get clientID() {
      return process.env.WINDOWS_LIVE_CLIENT_ID
    },
    get clientSecret() {
      return process.env.WINDOWS_LIVE_CLIENT_SECRET
    },
  }
})

// Spotify OAuth2 provider settings
Object.defineProperty(PROVIDERS, 'spotify', {
  get: () => !castBooleanEnv('SPOTIFY_ENABLE') ? null : {
    get clientID() {
      return process.env.SPOTIFY_CLIENT_ID
    },
    get clientSecret() {
      return process.env.SPOTIFY_CLIENT_SECRET
    },
  }
})

export { PROVIDERS }
