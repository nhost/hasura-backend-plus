import { Router } from 'express'
import { Strategy } from 'passport-github2'
import Boom from '@hapi/boom'
import { PROVIDERS } from '@shared/config'
import { initProvider } from './utils'

export default (router: Router): void => {
  const options = PROVIDERS.github

  initProvider(router, 'github', Strategy, { scope: ['user:email'] }, (req, res, next) => {
    if(!PROVIDERS.github) {
      throw Boom.badImplementation(`Please set the GITHUB_ENABLE env variable to true to use the auth/providers/github routes.`)
    } else if (!options?.clientID || !options?.clientSecret) {
      throw Boom.badImplementation(`Missing environment variables for GitHub OAuth.`)
    } else {
      return next();
    }
  })
}
