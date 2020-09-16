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
router.get('/version', (_req, res) =>
  res.send(JSON.stringify({ version: 'v' + process.env.npm_package_version }))
)

// all other routes should throw 404 not found
router.use('*', () => {
  throw Boom.notFound()
})

export default router
