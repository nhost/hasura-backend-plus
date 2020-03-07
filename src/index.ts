import 'dotenv/config'

import cors from 'cors'
import { errorMiddleware } from './utils/errors'
import express from 'express'
import helmet from 'helmet'
import { json } from 'body-parser'
import { limiter } from './utils/limiter'
import { router } from './routes'

/**
 * Port can be changed to your liking through the .env file
 */
const { PORT = 3000 } = process.env

try {
  /**
   * Initialize application
   */
  const app = express()

  /**
   * Rate limiting in production
   */
  if (process.env.NODE_ENV === 'production') {
    app.use(limiter)
  }

  app
    /**
     * Security middleware
     */
    .use(helmet())

    /**
     * JSON middleware
     */
    .use(json())

    /**
     * CORS middleware
     */
    .use(cors())

    /**
     * Connect all API routes
     */
    .use(router)

    /**
     * Error middleware
     */
    .use(errorMiddleware)

  /**
   * Start application
   */
  app.listen(PORT, () => {
    console.log(`Running on http://localhost:${PORT}`)
  })
} catch (err) {
  /**
   * Log errors
   */
  console.error(err)

  /**
   * Kill application
   */
  process.exit(1)
}
