import { Router } from 'express'
import { Strategy } from 'passport-twitter'
import Boom from '@hapi/boom'
import { initProvider } from './utils'
import { PROVIDERS, COOKIE_SECRET } from '@shared/config'
import session from 'express-session'

export default (router: Router): void => {
  const options = PROVIDERS.twitter

  // Checks if the strategy is enabled. Don't create any route otherwise
  if (options) {
    // Checks if the strategy has at least a consumer key and a consumer secret
    if (!options.consumerKey || !options.consumerSecret || !COOKIE_SECRET) {
      throw Boom.badImplementation(`Missing environment variables for Twitter OAuth.`)
    }
    if (!COOKIE_SECRET) {
      throw Boom.badImplementation(
        'Missing COOKIE_SECRET environment variable that is required for Twitter OAuth.'
      )
    }
    router.use(
      '/twitter',
      session({ secret: COOKIE_SECRET, resave: true, saveUninitialized: true })
    )
    initProvider(router, 'twitter', Strategy, {
      userProfileURL:
        'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true',
      includeEmail: true
    })
  }
}
