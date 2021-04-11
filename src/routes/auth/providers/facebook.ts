import { Router } from 'express'
import { Strategy } from 'passport-facebook'
import Boom from '@hapi/boom'
import { PROVIDERS } from '@shared/config'
import { initProvider } from './utils'

export default (router: Router): void => {
  const options = PROVIDERS.facebook

  initProvider(router, 'facebook', Strategy, { profileFields: ['email', 'photos', 'displayName']  }, (req, res, next) => {
    if(!PROVIDERS.facebook) {
      throw Boom.badImplementation(`Please set the FACEBOOK_ENABLE env variable to true to use the auth/providers/facebook routes.`)
    } else if (!options?.clientID || !options?.clientSecret) {
      throw Boom.badImplementation(`Missing environment variables for Facebook OAuth.`)
    } else {
      return next();
    }
  })
}
