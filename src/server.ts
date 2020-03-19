import { COOKIE_SECRET, SERVER_PORT } from '@shared/config'

import cookie from 'cookie-parser'
import cors from 'cors'
import { errors } from './errors'
import express from 'express'
import fileUpload from 'express-fileupload'
import helmet from 'helmet'
import { json } from 'body-parser'
import { limiter } from './limiter'
import { router } from './routes'

export const app = express()

try {
  if (process.env.NODE_ENV === 'production') {
    app.use(limiter)
  }

  app.use(helmet())
  app.use(json())
  app.use(cors())
  app.use(fileUpload())

  /**
   * Set a cookie secret to enable server validation of cookies.
   */
  if (COOKIE_SECRET) {
    app.use(cookie(COOKIE_SECRET))
  } else {
    app.use(cookie())
  }

  app.use(router)
  app.use(errors)

  app.listen(SERVER_PORT, () => {
    console.log(`Running on http://localhost:${SERVER_PORT}`)
  })
} catch (err) {
  console.error(err)
  process.exit(1)
}
