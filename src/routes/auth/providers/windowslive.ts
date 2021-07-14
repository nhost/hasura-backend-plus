import { Router } from 'express'
import { Strategy } from 'passport-windowslive'
import { initProvider } from './utils'
import { PROVIDERS } from '@shared/config'

export default (router: Router): void => {
  const options = PROVIDERS.windowslive

  initProvider(
    router,
    'windowslive',
    Strategy,
    {
      scope: [
        'wl.basic',
        'wl.emails',
        // The scope 'wl.contacts_emails' is a undocumented scope which allows us
        // to retrieve the email address of the Windows Live account
        'wl.contacts_emails'
      ]
    },
    (req, res, next) => {
      if (!PROVIDERS.windowslive) {
        return res.boom.badImplementation(
          `Please set the WINDOWSLIVE_ENABLED env variable to true to use the auth/providers/windowslive routes.`
        )
      } else if (!options?.clientID || !options?.clientSecret) {
        return res.boom.badImplementation(`Missing environment variables for Windows Live OAuth.`)
      } else {
        return next()
      }
    }
  )
}
