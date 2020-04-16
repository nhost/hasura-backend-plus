import { Router } from 'express'
import { Strategy } from 'passport-github2'
import Boom from '@hapi/boom'
import { AUTH_PROVIDERS } from '@shared/config'
import { initProvider } from './utils'

export default (router: Router): void => {
  const options = AUTH_PROVIDERS.github
  // Checks if the strategy is enabled. Don't create any route otherwise
  if (options) {
    // Checks if the strategy has at least a client ID and a client secret
    if (!options.clientID || !options.clientSecret) {
      throw Boom.badImplementation(`Missing environment variables for GitHub OAuth.`)
    }
    initProvider(router, 'github', Strategy, { scope: ['user:email'] })
  }
}
