import { Router } from 'express'
import { Strategy } from 'passport-bitbucket-oauth2'
import { PROVIDERS } from '@shared/config'
import { initProvider } from './utils'

export default (router: Router): void => {
  const options = PROVIDERS.bitbucket

  initProvider(router, 'bitbucket', Strategy, {}, (req, res, next) => {
    if(!options) {
      return res.boom.badImplementation(`Please set the BITBUCKET_ENABLE env variable to true to use the auth/providers/bitbucket routes.`)
    } else if (!options?.clientID || !options?.clientSecret) {
      return res.boom.badImplementation(`Missing environment variables for Bitbucket OAuth.`)
    } else {
      return next();
    }
  })
}
