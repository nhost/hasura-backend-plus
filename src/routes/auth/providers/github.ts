import { Router } from 'express'
import { Strategy } from 'passport-github2'
import { initProvider } from './utils'

import {
  AUTH_GITHUB_AUTHORIZATION_URL,
  AUTH_GITHUB_TOKEN_URL,
  AUTH_GITHUB_USER_PROFILE_URL,
  PROVIDERS_FAILURE_REDIRECT
} from '@shared/config'

export default (router: Router): void =>
  initProvider(router, 'github', Strategy, {
    authorizationURL: AUTH_GITHUB_AUTHORIZATION_URL, // optional
    tokenURL: AUTH_GITHUB_TOKEN_URL, // optional
    userProfileURL: AUTH_GITHUB_USER_PROFILE_URL, // optional
    scope: ['user:email']
  })
