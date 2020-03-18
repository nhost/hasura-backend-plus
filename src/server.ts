import 'dotenv/config'

import cookie from 'cookie-parser'
import cors from 'cors'
import { errors } from './errors'
import express from 'express'
import fileUpload from 'express-fileupload'
import helmet from 'helmet'
import { json } from 'body-parser'
import { limiter } from './limiter'
import { router } from './routes'

const { COOKIE_SECRET: secret, SERVER_PORT: port = 3000 } = process.env

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
  if (secret) {
    app.use(cookie(secret))
  } else {
    app.use(cookie())
  }

  app.use(router)
  app.use(errors)

  app.listen(port, () => {
    console.log(`Running on http://localhost:${port}`)
  })
} catch (err) {
  console.error(err)
  process.exit(1)
}
