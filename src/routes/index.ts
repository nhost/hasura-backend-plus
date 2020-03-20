import { deleteFile, getFile, getFileMeta, uploadFile } from './storage'
import { deleteUser, verifyUser } from './auth/user'
import { disableMfa, enableMfa, generateMfa, totpLogin } from './auth/mfa'
import { forgotEmail, forgotPassword } from './auth/forgot'
import { getJwks, loginUser, registerUser } from './auth'
import { refreshToken, revokeToken } from './auth/token'
import { resetEmail, resetPassword } from './auth/reset'

import { Router } from 'express'

export const router = Router()
  .get('/auth/jwks', getJwks)

  .post('/auth/login', loginUser)
  .post('/auth/register', registerUser)

  .post('/auth/token/refresh', refreshToken)
  .post('/auth/token/revoke', revokeToken)

  .get('/auth/user/verify', verifyUser)
  .post('/auth/user/delete', deleteUser)

  .post('/auth/forgot/email', forgotEmail)
  .post('/auth/forgot/password', forgotPassword)

  .post('/auth/reset/email', resetEmail)
  .post('/auth/reset/password', resetPassword)

  .post('/auth/mfa/disable', disableMfa)
  .post('/auth/mfa/enable', enableMfa)
  .post('/auth/mfa/generate', generateMfa)
  .post('/auth/mfa/totp', totpLogin)

  .delete('/storage/file/*', deleteFile)
  .get('/storage/file-meta/*', getFileMeta)
  .get('/storage/file/*', getFile)
  .post('/storage/upload', uploadFile)

  .get('/healthz', (_req, res) => res.send('OK'))
