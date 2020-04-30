import { MFA_ENABLE, CHANGE_EMAIL_ENABLE } from '@shared/config'
import { Router } from 'express'
import account from './account'
import changeEmail from './change-email'
import getJwks from './jwks'
import loginAccount from './login'
import logout from './logout'
import logoutAll from './logout-all'
import mfa from './mfa'
import changePassword from './change-password'
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

if (CHANGE_EMAIL_ENABLE) {
  router.use('/change-email', changeEmail)
}

router
  .get('/jwks', getJwks)
  .post('/login', loginAccount)
  .post('/logout', logout)
  .post('/logout-all', logoutAll)
  .post('/register', registerAccount)
  .use('/token', token)
  .use('/account', account)
  .use('/change-password', changePassword)

export default router
