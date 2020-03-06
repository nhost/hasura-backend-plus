import activate from './activate'
import forgot from './forgot'
import login from './login'
import polka from 'polka'
import refresh from './refresh'
import register from './register'

/**
 * Create a Polka Router
 */
const Router = polka()

/**
 * Connect all API routes
 */
const apiRouter = Router.use('/login', login)
  .use('/forgot', forgot)
  .use('/refresh', refresh)
  .use('/register', register)
  .use('/activate', activate)

/**
 * Export the API Router
 */
export { apiRouter }
