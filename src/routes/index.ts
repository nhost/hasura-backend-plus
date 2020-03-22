import {
  activateUser,
  deleteUser,
  disableMfa,
  enableMfa,
  forgotEmail,
  forgotPassword,
  generateMfa,
  getJwks,
  loginUser,
  refreshToken,
  registerUser,
  resetEmail,
  resetPassword,
  revokeToken,
  totpLogin
} from './auth'
import { deleteFile, getFile, getFileMeta, revokeFile, uploadFile } from './storage'

import { Router } from 'express'

export const router = Router()
  .get('/auth/jwks', getJwks)

  .post('/auth/login', loginUser)
  .post('/auth/register', registerUser)

  .post('/auth/token/refresh', refreshToken)
  .post('/auth/token/revoke', revokeToken)

  .get('/auth/user/activate', activateUser)
  .post('/auth/user/delete', deleteUser)

  .post('/auth/password/forgot', forgotPassword)
  .post('/auth/password/reset', resetPassword)

  .post('/auth/email/forgot', forgotEmail)
  .post('/auth/email/reset', resetEmail)

  .post('/auth/mfa/disable', disableMfa)
  .post('/auth/mfa/enable', enableMfa)
  .post('/auth/mfa/generate', generateMfa)
  .post('/auth/mfa/totp', totpLogin)

  .delete('/storage/file/*', deleteFile)
  .get('/storage/file-meta/*', getFileMeta)
  .get('/storage/file/*', getFile)
  .post('/storage/revoke/*', revokeFile)
  .post('/storage/upload', uploadFile)

  .get('/healthz', (_req, res) => res.send('OK'))
