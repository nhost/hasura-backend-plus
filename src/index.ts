import 'dotenv/config'

import cors from 'cors'
import { errorMiddleware } from './utils/errors'
import express from 'express'
import { json } from 'body-parser'
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
    .use(json()) // JSON middleware
    .use(cors()) // CORS middleware
    .use(router) // Connect all API routes

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
