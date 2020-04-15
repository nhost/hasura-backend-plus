import { Router } from 'express'
import { Strategy } from 'passport-google-oauth20'
import { initProvider } from './utils'

export default (router: Router): void =>
  initProvider(router, 'google', Strategy, {
    scope: ['profile']
  })
