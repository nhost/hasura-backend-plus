import { Router } from 'express'
import { Strategy } from '@riderize/passport-strava-oauth2'
import { PROVIDERS } from '@shared/config'
import { initProvider } from './utils'

export default (router: Router): void => {
  const options = PROVIDERS.strava

  initProvider(router, 'strava', Strategy, { scope: options?.scope }, (req, res, next) => {
    if(!PROVIDERS.strava) {
      return res.boom.badImplementation(`Please set the STRAVA_ENABLE env variable to true to use the auth/providers/strava routes.`)
    } else if (!options?.clientID || !options?.clientSecret) {
      return res.boom.badImplementation(`Missing environment variables for Strava OAuth.`)
    } else {
      return next();
    }
  })
}
