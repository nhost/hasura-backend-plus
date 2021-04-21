import { castBooleanEnv } from '../utils'
import { APPLICATION } from '../application'

const PROVIDERS = {
  get REDIRECT_SUCCESS() {
    return process.env.PROVIDER_SUCCESS_REDIRECT || APPLICATION.REDIRECT_URL_SUCCESS
  },
  get REDIRECT_FAILURE() {
    return process.env.PROVIDER_FAILURE_REDIRECT || APPLICATION.REDIRECT_URL_ERROR
  },

  get github() {
    return !castBooleanEnv('GITHUB_ENABLE') ? null : {
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
  },

  get google() {
    return !castBooleanEnv('GOOGLE_ENABLE') ? null : {
      get clientID() {
        return process.env.GOOGLE_CLIENT_ID || ''
      },
      get clientSecret() {
        return process.env.GOOGLE_CLIENT_SECRET || ''
      },
    }
  },

  get facebook() {
    return !castBooleanEnv('FACEBOOK_ENABLE') ? null : {
      get clientID() {
        return process.env.FACEBOOK_CLIENT_ID || ''
      },
      get clientSecret() {
        return process.env.FACEBOOK_CLIENT_SECRET || ''
      },
    }
  },

  get twitter() {
    return !castBooleanEnv('TWITTER_ENABLE') ? null : {
      get consumerKey() {
        return process.env.TWITTER_CONSUMER_KEY || ''
      },
      get consumerSecret() {
        return process.env.TWITTER_CONSUMER_SECRET || ''
      },
    }
  },

  get linkedin() {
    return !castBooleanEnv('LINKEDIN_ENABLE') ? null : {
      get clientID() {
        return process.env.LINKEDIN_CLIENT_ID || ''
      },
      get clientSecret() {
        return process.env.LINKEDIN_CLIENT_SECRET || ''
      },
    }
  },

  get apple() {
    if (!castBooleanEnv('APPLE_ENABLE')) return null;
    try {
      return {
        get clientID() {
          return process.env.APPLE_CLIENT_ID || ''
        },
        get teamID() {
          return process.env.APPLE_TEAM_ID || ''
        },
        get keyID() {
          return process.env.APPLE_KEY_ID || ''
        },
        get key() {
          return process.env.APPLE_PRIVATE_KEY &&
          // Convert contents from base64 string to string to avoid issues with line breaks in the environment variable
          Buffer.from(process.env.APPLE_PRIVATE_KEY, 'base64').toString('ascii') || ''
        }
      }
    } catch (e) {
      throw new Error(`Invalid Apple OAuth Key file.`)
    }
  },

  get windowslive() {
    return !castBooleanEnv('WINDOWS_LIVE_ENABLE') ? null : {
      get clientID() {
        return process.env.WINDOWS_LIVE_CLIENT_ID || ''
      },
      get clientSecret() {
        return process.env.WINDOWS_LIVE_CLIENT_SECRET || ''
      },
    }
  },

  get spotify() {
    return !castBooleanEnv('SPOTIFY_ENABLE') ? null : {
      get clientID() {
        return process.env.SPOTIFY_CLIENT_ID || ''
      },
      get clientSecret() {
        return process.env.SPOTIFY_CLIENT_SECRET || ''
      },
    }
  }
}

export { PROVIDERS }
