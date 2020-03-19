import { deleteFile, getFile, getFileMeta, uploadFile } from './storage'
import { deleteUser, forgotPassword, resetPassword, verifyUser } from './auth/user'
import { disableMfa, enableMfa, generateMfa, totpLogin } from './auth/mfa'
import { getJwks, loginUser, registerUser } from './auth'
import { refreshToken, revokeToken } from './auth/token'

import { Router } from 'express'

export const router = Router()
  .get('/auth/jwks', getJwks)

  .get('/healthz', (_req, res) => res.send('OK'))

  .post('/auth/login', loginUser)
  .post('/auth/register', registerUser)

  .post('/auth/token/refresh', refreshToken)
  .post('/auth/token/revoke', revokeToken)

  .get('/auth/user/verify', verifyUser)
  .post('/auth/user/delete', deleteUser)
  .post('/auth/user/forgot', forgotPassword)
  .post('/auth/user/reset', resetPassword)

  .post('/auth/mfa/disable', disableMfa)
  .post('/auth/mfa/enable', enableMfa)
  .post('/auth/mfa/generate', generateMfa)
  .post('/auth/mfa/totp', totpLogin)

  .delete('/storage/file/*', deleteFile)
  .get('/storage/file-meta/*', getFileMeta)
  .get('/storage/file/*', getFile)
  .post('/storage/upload', uploadFile)
