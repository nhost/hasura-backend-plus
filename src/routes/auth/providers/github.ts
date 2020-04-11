import { Router } from 'express'
import passport from 'passport'
import { Strategy } from 'passport-github2'

import {
  PROVIDERS_FAILURE_REDIRECT,
  AUTH_GITHUB_CLIENT_ID,
  AUTH_GITHUB_CLIENT_SECRET,
  AUTH_GITHUB_CALLBACK_URL,
  AUTH_GITHUB_AUTHORIZATION_URL,
  AUTH_GITHUB_TOKEN_URL,
  AUTH_GITHUB_USER_PROFILE_URL
} from '@shared/config'
import { manageProviderStrategy, providerCallback } from './utils'
import Boom from '@hapi/boom'

const initRoutes = (): Router => {
  if (
    !AUTH_GITHUB_CLIENT_ID ||
    !AUTH_GITHUB_CLIENT_SECRET ||
    !AUTH_GITHUB_CALLBACK_URL ||
    !AUTH_GITHUB_AUTHORIZATION_URL ||
    !AUTH_GITHUB_TOKEN_URL ||
    !AUTH_GITHUB_USER_PROFILE_URL
  ) {
    throw Boom.badImplementation('Missing environment variables for GitHub OAuth.')
  }

  passport.use(
    new Strategy(
      {
        clientID: AUTH_GITHUB_CLIENT_ID,
        clientSecret: AUTH_GITHUB_CLIENT_SECRET,
        callbackURL: AUTH_GITHUB_CALLBACK_URL,
        authorizationURL: AUTH_GITHUB_AUTHORIZATION_URL,
        tokenURL: AUTH_GITHUB_TOKEN_URL,
        userProfileURL: AUTH_GITHUB_USER_PROFILE_URL,
        scope: ['user:email'],
        passReqToCallback: true
      },
      manageProviderStrategy('github')
    )
  )

  const router = Router()

  router.get('/', passport.authenticate('github', { session: false }))

  router.get(
    '/callback',
    passport.authenticate('github', {
      failureRedirect: PROVIDERS_FAILURE_REDIRECT,
      session: false
    }),
    providerCallback
  )

  return router
}

export default initRoutes
