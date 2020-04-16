import { Router } from 'express'
import { Strategy } from '@nicokaiser/passport-apple'
import Boom from '@hapi/boom'
import { AUTH_PROVIDERS } from '@shared/config'
import { initProvider } from './utils'

export default (router: Router): void => {
  const options = AUTH_PROVIDERS.apple

  // Checks if the strategy is enabled. Don't create any route otherwise
  if (options) {
    // Convert contents from base64 string to string
    const decodedPrivateKey = new Buffer(options.key, 'base64').toString('ascii')
    console.log(`decodedPrivateKey: ${decodedPrivateKey}`)

    // Overwrite the `key`-option with the decoded private key supplied by Apple
    options.key = decodedPrivateKey
    console.log(`All Apple strategy settings: `, options)

    if (!options.clientID || !options.teamID || !options.keyID || !options.key) {
      throw Boom.badImplementation(`Missing environment variables for Login with Apple OAuth.`)
    }
    initProvider(router, 'apple', Strategy, { scope: ['name', 'email'] })
  }
}
