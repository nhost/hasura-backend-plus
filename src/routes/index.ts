import { Router } from 'express'

import auth from './auth'
import storage from './storage'

export const router = Router()
  .use('/auth', auth)
  .use('/storage', storage)
  .get('/healthz', (_req, res) => res.send('OK'))
