import { Router } from 'express'
import { Strategy } from 'passport-spotify'
import Boom from '@hapi/boom'
import { PROVIDERS } from '@shared/config'
import { initProvider } from './utils'

export default (router: Router): void => {
  const options = PROVIDERS.spotify
  // Checks if the strategy is enabled. Don't create any route otherwise
  if (options) {
    // Checks if the strategy has at least a client ID and a client secret
    if (!options.clientID || !options.clientSecret) {
      throw Boom.badImplementation(`Missing environment variables for Spotify OAuth.`)
    }
    const scope = options.scope ? options.scope.split(',') : ['user-read-email', 'user-read-private']
    initProvider(router, 'spotify', Strategy, { scope })
  }
}
