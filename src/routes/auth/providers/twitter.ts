import { Router } from 'express'
import { Strategy } from 'passport-twitter'
import Boom from '@hapi/boom'
import { initProvider } from './utils'
import { AUTH_PROVIDERS } from '@shared/config'

export default (router: Router): void => {
  const options = AUTH_PROVIDERS.twitter

  // Checks if the strategy is enabled. Don't create any route otherwise
  if (options) {
    // Checks if the strategy has at least a consumer key and a consumer secret
    if (!options.consumerKey || !options.consumerSecret) {
      throw Boom.badImplementation(`Missing environment variables for Twitter.`)
    }
    initProvider(router, 'twitter', Strategy, {})
  }
}
