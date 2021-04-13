import { Router } from 'express'
import { Strategy } from 'passport-google-oauth20'
import { initProvider } from './utils'
import { PROVIDERS } from '@shared/config'

export default (router: Router): void => {
  const options = PROVIDERS.google

  initProvider(router, 'google', Strategy, { scope: ['email', 'profile'] }, (req, res, next) => {
    if(!PROVIDERS.google) {
      return res.boom.badImplementation(`Please set the GOOGLE_ENABLE env variable to true to use the auth/providers/google routes.`)
    } else if (!options?.clientID || !options?.clientSecret) {
      return res.boom.badImplementation(`Missing environment variables for Google OAuth.`)
    } else {
      return next();
    }
  })
}
