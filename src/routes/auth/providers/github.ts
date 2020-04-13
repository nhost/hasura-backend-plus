import {
  AUTH_GITHUB_AUTHORIZATION_URL,
  AUTH_GITHUB_CALLBACK_URL,
  AUTH_GITHUB_CLIENT_ID,
  AUTH_GITHUB_CLIENT_SECRET,
  AUTH_GITHUB_TOKEN_URL,
  AUTH_GITHUB_USER_PROFILE_URL,
  PROVIDERS_FAILURE_REDIRECT
} from '@shared/config'
import { manageProviderStrategy, providerCallback } from './utils'

import Boom from '@hapi/boom'
import { Router } from 'express'
import { Strategy } from 'passport-github2'
import passport from 'passport'

const initRoutes = (): Router => {
  if (!AUTH_GITHUB_CLIENT_ID || !AUTH_GITHUB_CLIENT_SECRET || !AUTH_GITHUB_CALLBACK_URL) {
    throw Boom.badImplementation('Missing environment variables for GitHub OAuth.')
  }

  passport.use(
    new Strategy(
      {
        clientID: AUTH_GITHUB_CLIENT_ID, // required
        clientSecret: AUTH_GITHUB_CLIENT_SECRET, // required
        callbackURL: AUTH_GITHUB_CALLBACK_URL, // required
        authorizationURL: AUTH_GITHUB_AUTHORIZATION_URL, // optional
        tokenURL: AUTH_GITHUB_TOKEN_URL, // optional
        userProfileURL: AUTH_GITHUB_USER_PROFILE_URL, // optional
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
