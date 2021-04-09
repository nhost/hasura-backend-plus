import { Router } from 'express'
import { Strategy } from 'passport-spotify'
import Boom from '@hapi/boom'
import { PROVIDERS } from '@shared/config'
import { initProvider } from './utils'

export default (router: Router): void => {
  const options = PROVIDERS.spotify

  initProvider(router, 'spotify', Strategy, {
      scope: ['user-read-email', 'user-read-private']
  }, (req, res, next) => {
    if(!PROVIDERS.spotify) {
      throw Boom.badImplementation(`Please set the SPOTIFY_ENABLE env variable to true to use the auth/providers/spotify routes.`)
    } else if (!options?.clientID || !options?.clientSecret) {
      throw Boom.badImplementation(`Missing environment variables for Spotify OAuth.`)
    } else {
      return next();
    }
  })
}
