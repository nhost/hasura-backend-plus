import { MFA_ENABLE } from '@shared/config'
import { Router } from 'express'
import account from './account'
import email from './email'
import getJwks from './jwks'
import loginAccount from './login'
import mfa from './mfa'
import password from './password'
import providers from './providers'
import registerAccount from './register'
import token from './token'

const router = Router()

if (providers) {
  router.use('/providers', providers)
}

if (MFA_ENABLE) {
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
