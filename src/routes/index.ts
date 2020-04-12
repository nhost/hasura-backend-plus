import { Router } from 'express'

import auth from './auth'
import storage from './storage'
import { AUTH_ENABLE, STORAGE_ENABLE } from '@shared/config'

const router = Router()

if (AUTH_ENABLE) {
  router.use('/auth', auth)
}

if (STORAGE_ENABLE) {
  router.use('/storage', storage)
}

router.get('/healthz', (_req, res) => res.send('OK'))

export default router
