import { Router } from 'express'

import { deleteFile, getFile, getFileMeta, uploadFile } from './storage'
import {
  getJwks,
  loginUser,
  registerUser,
  refreshToken,
  revokeToken,
  activateUser,
  deleteUser,
  forgotPassword,
  resetPassword,
  forgotEmail,
  resetEmail,
  disableMfa,
  enableMfa,
  generateMfa,
  totpLogin
} from './auth'

export const router = Router()
  .get('/auth/jwks', getJwks)

  .post('/auth/login', loginUser)
  .post('/auth/register', registerUser)

  .post('/auth/token/refresh', refreshToken)
  .post('/auth/token/revoke', revokeToken)

  .get('/auth/user/activate', activateUser)
  .post('/auth/user/delete', deleteUser)

  .post('/auth/user/password/forgot', forgotPassword)
  .post('/auth/user/password/reset', resetPassword)

  .post('/auth/email/forgot', forgotEmail)
  .post('/auth/email/reset', resetEmail)

  .post('/auth/mfa/disable', disableMfa)
  .post('/auth/mfa/enable', enableMfa)
  .post('/auth/mfa/generate', generateMfa)
  .post('/auth/mfa/totp', totpLogin)

  .delete('/storage/file/*', deleteFile)
  .get('/storage/file-meta/*', getFileMeta)
  .get('/storage/file/*', getFile)
  .post('/storage/upload', uploadFile)

  .get('/healthz', (_req, res) => res.send('OK'))
