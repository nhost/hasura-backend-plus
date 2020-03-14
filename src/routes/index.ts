import { Router } from 'express'
import activate from './auth/user/activate'
import disable from './auth/mfa/disable'
import enable from './auth/mfa/enable'
import forgot from './auth/user/forgot'
import generate from './auth/mfa/generate'
import login from './auth/login'
import refresh from './auth/token/refresh'
import register from './auth/register'
import revoke from './auth/token/revoke'
import totp from './auth/mfa/totp'

export const router = Router()
  .use('/auth/login', login)
  .use('/auth/mfa/totp', totp)
  .use('/auth/mfa/enable', enable)
  .use('/auth/register', register)
  .use('/auth/user/forgot', forgot)
  .use('/auth/mfa/disable', disable)
  .use('/auth/token/revoke', revoke)
  .use('/auth/mfa/generate', generate)
  .use('/auth/token/refresh', refresh)
  .use('/auth/user/activate', activate)
