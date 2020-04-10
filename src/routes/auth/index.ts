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

export default Router()
  .get('/jwks', getJwks)
  .post('/login', loginAccount)
  .post('/register', registerAccount)
  .use('/token', token)
  .use('/account', account)
  .use('/email', email)
  .use('/password', password)
  .use('/mfa', mfa)
  .use('/providers', providers)
