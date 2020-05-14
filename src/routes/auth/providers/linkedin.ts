import { Router } from 'express'
import { Strategy } from 'passport-linkedin-oauth2'
import Boom from '@hapi/boom'
import { initProvider } from './utils'
import { PROVIDERS } from '@shared/config'

export default (router: Router): void => {
  const options = PROVIDERS.linkedin

  // Checks if the strategy is enabled. Don't create any route otherwise
  if (options) {
    // Checks if the strategy has at least a consumer key and a consumer secret
    if (!options.clientID || !options.clientSecret) {
      throw Boom.badImplementation(`Missing environment variables for LinkedIn.`)
    }
    initProvider(router, 'linkedin', Strategy, {
      scope: ['r_emailaddress', 'r_liteprofile']
    })
  }
}
