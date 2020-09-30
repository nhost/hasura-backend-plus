import {
  MFA_ENABLE,
  CHANGE_EMAIL_ENABLE,
  AUTO_ACTIVATE_NEW_USERS,
  ALLOW_USER_SELF_DELETE,
  AUTH_LOCAL_USERS_ENABLE,
  FIREBASE_AUTH_ENABLE
} from '@shared/config'
import { Router } from 'express'
import { initializeFirebaseApp } from '@shared/firebase'
import nocache from 'nocache'
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
import firebase from './firebase'

const router = Router()

router.use(nocache())

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

if (AUTH_LOCAL_USERS_ENABLE) {
  router
    .post('/login', loginAccount)
    .post('/logout', logout)
    .post('/register', registerAccount)
    .use('/change-password', changePassword)
}

if (FIREBASE_AUTH_ENABLE) {
  initializeFirebaseApp()
  router.post('/firebase', firebase)
}

router.get('/jwks', getJwks)
router.use('/token', token)

export default router
