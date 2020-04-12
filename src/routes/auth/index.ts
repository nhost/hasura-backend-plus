import { Router } from 'express'

import getJwks from './jwks'
import loginAccount from './login'
import registerAccount from './register'
import token from './token'
import account from './account'
import password from './password'
import email from './email'
import mfa from './mfa'
import providers from './providers'
import { AUTH_MFA_ENABLE } from '@shared/config'

const router = Router()

if (providers) {
  router.use('/providers', providers)
}

if (AUTH_MFA_ENABLE) {
  router.use('/mfa', mfa)
}

router
  .get('/jwks', getJwks)
  .post('/login', loginAccount)
  .post('/register', registerAccount)
  .use('/token', token)
  .use('/account', account)
  .use('/email', email)
  .use('/password', password)

export default router
