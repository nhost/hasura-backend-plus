import { Router } from 'express'
import { Strategy } from 'passport-linkedin-oauth2'
import Boom from '@hapi/boom'
import { initProvider } from './utils'
import { PROVIDERS } from '@shared/config'

export default (router: Router): void => {
  const options = PROVIDERS.linkedin

  initProvider(router, 'linkedin', Strategy, {
    scope: ['r_emailaddress', 'r_liteprofile']
  }, (req, res, next) => {
    if(!PROVIDERS.apple) {
      throw Boom.badImplementation(`Please set the LINKEDIN_ENABLE env variable to true to use the auth/providers/linkedin routes.`)
    } else if (!options?.clientID || !options?.clientSecret) {
      throw Boom.badImplementation(`Missing environment variables for LinkedIn OAuth.`)
    } else {
      return next();
    }
  })
}
