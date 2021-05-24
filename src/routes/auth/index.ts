import { Router } from 'express'
import nocache from 'nocache'

import { AUTHENTICATION } from '@shared/config'

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
import magicLink from './magic-link'
import smsMfa from './mfa/sms'

const router = Router()

router.use(nocache())

router.use((req, res, next) => {
  if (!AUTHENTICATION.ENABLE) {
    return res.boom.badImplementation(
      `Please set the AUTH_ENABLE env variable to true to use the auth routes.`
    )
  } else {
    return next()
  }
})

router.use('/providers', providers)
router.use('/mfa', mfa)
router.use('/mfa/sms', smsMfa)
router.use('/change-email', changeEmail)
router.get('/activate', activateAccount)
router.post('/delete', deleteAccount)
router
  .post('/login', loginAccount)
  .post('/logout', logout)
  .post('/register', registerAccount)
  .use('/change-password', changePassword)
router.get('/jwks', getJwks)
router.use('/token', token)
router.get('/magic-link', magicLink)

export default router
