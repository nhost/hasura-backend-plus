import { Router } from 'express'
import activate from './auth/user/activate'
import disable from './auth/mfa/disable'
import enable from './auth/mfa/enable'
import forgot from './auth/user/forgot'
import generate from './auth/mfa/generate'
import login from './auth/login'
import refresh from './auth/token/refresh'
import register from './auth/register'
import remove from './auth/user/remove'
import revoke from './auth/token/revoke'
import totp from './auth/mfa/totp'

export const router = Router()
  .post('/auth/login', login)
  .post('/auth/register', register)

  .post('/auth/mfa/disable', disable)
  .post('/auth/mfa/enable', enable)
  .post('/auth/mfa/generate', generate)
  .post('/auth/mfa/totp', totp)

  .post('/auth/token/refresh', refresh)
  .post('/auth/token/revoke', revoke)

  .post('/auth/user/activate', activate)
  .post('/auth/user/forgot', forgot)
  .post('/auth/user/remove', remove)
