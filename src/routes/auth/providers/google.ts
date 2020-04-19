import { Router } from 'express'
import { Strategy } from 'passport-google-oauth20'
import Boom from '@hapi/boom'
import { initProvider } from './utils'
import { PROVIDERS } from '@shared/config'

export default (router: Router): void => {
  const options = PROVIDERS.google
  // Checks if the strategy is enabled. Don't create any route otherwise
  if (options) {
    // Checks if the strategy has at least a client ID and a client secret
    if (!options.clientID || !options.clientSecret) {
      throw Boom.badImplementation(`Missing environment variables for Google OAuth.`)
    }
    initProvider(router, 'google', Strategy, { scope: ['email', 'profile'] })
  }
}
