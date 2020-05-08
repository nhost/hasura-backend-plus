import {
  MFA_ENABLE,
  CHANGE_EMAIL_ENABLE,
  AUTO_ACTIVATE_NEW_USERS,
  ALLOW_USER_SELF_DELETE
} from '@shared/config'
import { Router } from 'express'
import changeEmail from './change-email'
import getJwks from './jwks'
import loginAccount from './login'
import logout from './logout'
import mfa from './mfa'
import changePassword from './change-password'
import providers from './providers'
import registerAccount from './register'
import token from './token'
import activateAccount from './activate'
import deleteAccount from './delete'

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

if (!AUTO_ACTIVATE_NEW_USERS) {
  router.get('/activate', activateAccount)
}

if (ALLOW_USER_SELF_DELETE) {
  router.post('/delete', deleteAccount)
}

router
  .get('/jwks', getJwks)
  .post('/login', loginAccount)
  .post('/logout', logout)
  .post('/register', registerAccount)
  .use('/token', token)
  .use('/change-password', changePassword)

export default router
