import { Router } from 'express'
import { Strategy } from 'passport-facebook'
import Boom from '@hapi/boom'
import { PROVIDERS } from '@shared/config'
import { initProvider } from './utils'

export default (router: Router): void => {
  const options = PROVIDERS.facebook
  // Checks if the strategy is enabled. Don't create any route otherwise
  if (options) {
    // Checks if the strategy has at least a client ID and a client secret
    if (!options.clientID || !options.clientSecret) {
      throw Boom.badImplementation(`Missing environment variables for Facebook OAuth.`)
    }
    initProvider(router, 'facebook', Strategy, { scope: ['email'] })
  }
}
