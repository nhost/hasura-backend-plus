import { AUTH_ENABLE, STORAGE_ENABLE } from '@shared/config'

import { Router } from 'express'
import auth from './auth'
import storage from './storage'
import Boom from '@hapi/boom'

const router = Router()

if (AUTH_ENABLE) {
  router.use('/auth', auth)
}

if (STORAGE_ENABLE) {
  router.use('/storage', storage)
}

router.get('/healthz', (_req, res) => res.send('OK'))

// all other routes should throw 404 not found
router.use('*', () => {
  throw Boom.notFound()
})

export default router
