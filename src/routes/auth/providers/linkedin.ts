import { Router } from 'express'
import { Strategy } from 'passport-linkedin-oauth2'
import { initProvider } from './utils'
import { PROVIDERS } from '@shared/config'

export default (router: Router): void => {
  const options = PROVIDERS.linkedin

  initProvider(router, 'linkedin', Strategy, {
    scope: ['r_emailaddress', 'r_liteprofile']
  }, (req, res, next) => {
    if(!PROVIDERS.apple) {
      return res.boom.badImplementation(`Please set the LINKEDIN_ENABLE env variable to true to use the auth/providers/linkedin routes.`)
    } else if (!options?.clientID || !options?.clientSecret) {
      return res.boom.badImplementation(`Missing environment variables for LinkedIn OAuth.`)
    } else {
      return next();
    }
  })
}
