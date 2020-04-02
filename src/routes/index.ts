import { Router } from 'express'

import auth from './auth'
import storage from './storage'
import storagev2 from './storagev2'

export const router = Router()
  .use('/auth', auth)
  .use('/storage', storage)
  .use('/storagev2', storagev2)
  .get('/healthz', (_req, res) => res.send('OK'))
