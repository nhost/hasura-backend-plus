import { Router } from 'express'
import { Strategy } from 'passport-twitter'
import { initProvider } from './utils'
import { PROVIDERS } from '@shared/config'

export default (router: Router): void => {
  const options = PROVIDERS.twitter

  initProvider(router, 'twitter', Strategy, {
    userProfileURL:
      'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true',
    includeEmail: true,
  }, (req, res, next) => {
    if(!PROVIDERS.twitter) {
      return res.boom.badImplementation(`Please set the TWITTER_ENABLE env variable to true to use the auth/providers/twitter routes.`)
    } else if (!options?.consumerKey || !options?.consumerSecret) {
      return res.boom.badImplementation(`Missing environment variables for Twitter OAuth.`)
    } else {
      return next();
    }
  })
}
