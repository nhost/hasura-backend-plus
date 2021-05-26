import { Router } from 'express'
import { Strategy } from 'passport-steam'
import { PROVIDERS } from '@shared/config'
import { initProvider } from './utils'

export default (router: Router): void => {
  const options = PROVIDERS.steam

  initProvider(router, 'steam', Strategy, {}, (req, res, next) => {
    if(!PROVIDERS.steam) {
      return res.boom.badImplementation(`Please set the STEAM_ENABLE env variable to true to use the auth/providers/steam routes.`)
    } else if (!options?.apiKey || !options?.realm) {
      return res.boom.badImplementation(`Missing environment variables for Steam OAuth.`)
    } else {
      return next();
    }
  })
}
