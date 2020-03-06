import 'dotenv/config'

import { apiRouter } from './routes'
import cors from 'cors'
import { isDeveloper } from './utils/helpers'
import { json } from 'body-parser'
import polka from 'polka'

const { PORT = 3000 } = process.env

/**
 * Logger middleware
 */
function logger(req: any, _res: any, next: any) {
  console.log(`Received ${req.method} on ${req.url}`)
  next()
}

try {
  const app = polka()

  /**
   * JSON body parser middleware
   */
  app.use(json() as any)

  /**
   * CORS middleware
   */
  app.use(cors() as any)

  /**
   * Logger middleware, only in development mode
   */
  if (isDeveloper) app.use(logger)

  /**
   * Connect the API Router
   */
  app.use(apiRouter)

  /**
   * Start application
   */
  app.listen(PORT, () => {
    console.log(`Running on http://localhost:${PORT}`)
  })
} catch (err) {
  /**
   * Log error message
   */
  console.error(err)

  /**
   * Exit application
   */
  process.exit(1)
}
