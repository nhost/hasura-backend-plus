import { Router } from 'express'
import { Strategy } from 'passport-windowslive'
import Boom from '@hapi/boom'
import { initProvider } from './utils'
import { PROVIDERS } from '@shared/config'

export default (router: Router): void => {
  const options = PROVIDERS.windowslive

  // Checks if the strategy is enabled. Don't create any route otherwise
  if (options) {
    // Checks if the strategy has at least a consumer key and a consumer secret
    if (!options.clientID || !options.clientSecret) {
      throw Boom.badImplementation(`Missing environment variables for Windows Live.`)
    }
    initProvider(router, 'windowslive', Strategy, {
      scope: [
        'wl.basic',
        'wl.emails',
        // The scope 'wl.contacts_emails' is a undocumented scope which allows us
        // to retrieve the email address of the Windows Live account
        'wl.contacts_emails'
      ]
    })
  }
}
