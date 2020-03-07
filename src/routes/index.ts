import { Router } from 'express'
import activate from './activate'
import forgot from './forgot'
import login from './login'
import refresh from './refresh'
import register from './register'

/**
 * Connect all API routes
 */
export const router = Router()
  .use('/login', login)
  .use('/forgot', forgot)
  .use('/refresh', refresh)
  .use('/register', register)
  .use('/activate', activate)
