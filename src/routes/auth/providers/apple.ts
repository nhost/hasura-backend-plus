import { Router } from 'express'
import { Strategy, Profile } from '@nicokaiser/passport-apple'
import { PROVIDERS } from '@shared/config'
import { initProvider } from './utils'
import { UserData } from '@shared/types'

const transformProfile = ({ id, name, email, photos }: Profile): UserData => ({
  id,
  email,
  display_name: name ? `${name.firstName} ${name.lastName}` : email,
  avatar_url: photos?.[0].value
})

export default (router: Router): void => {
  const options = PROVIDERS.apple

  initProvider(
    router,
    'apple',
    Strategy,
    {
      scope: ['name', 'email'],
      transformProfile,
      callbackMethod: 'POST'
    },
    (req, res, next) => {
      if (!PROVIDERS.apple) {
        return res.boom.badImplementation(
          `Please set the APPLE_ENABLED env variable to true to use the auth/providers/apple routes.`
        )
      } else if (!options?.clientID || !options?.teamID || !options?.keyID || !options?.key) {
        return res.boom.badImplementation(`Missing environment variables for Apple OAuth.`)
      } else {
        return next()
      }
    }
  )
}
