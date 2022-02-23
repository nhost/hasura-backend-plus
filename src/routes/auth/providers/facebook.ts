import { Router } from 'express'
import { Strategy } from 'passport-facebook'
import { PROVIDERS } from '@shared/config'
import { initProvider } from './utils'

export default (router: Router): void => {
  const options = PROVIDERS.facebook

  initProvider(
    router,
    'facebook',
    Strategy,
    {
      profileFields: ['email', 'photos', 'displayName', 'link'],
      scope: ['public_profile', 'email', 'user_link']
    },
    (req, res, next) => {
      if (!PROVIDERS.facebook) {
        return res.boom.badImplementation(
          `Please set the FACEBOOK_ENABLED env variable to true to use the auth/providers/facebook routes.`
        )
      } else if (!options?.clientID || !options?.clientSecret) {
        return res.boom.badImplementation(`Missing environment variables for Facebook OAuth.`)
      } else {
        return next()
      }
    }
  )
}
