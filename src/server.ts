import { COOKIE_SECRET, AUTH_HAS_ONE_PROVIDER } from '@shared/config'
import cookie from 'cookie-parser'
import cors from 'cors'
import { errors } from './errors'
import express from 'express'
import fileUpload from 'express-fileupload'
import helmet from 'helmet'
import { json } from 'body-parser'
import { limiter } from './limiter'
import router from './routes'
import passport from 'passport'
import session from 'express-session'

const app = express()

if (process.env.NODE_ENV === 'production') {
  app.use(limiter)
}

app.use(helmet())
app.use(json())
app.use(cors())
app.use(fileUpload())
if (AUTH_HAS_ONE_PROVIDER) {
  app.use(passport.initialize())

  // TODO consider only enable sessions when the Twitter auth provider is active
  app.use(session({ secret: COOKIE_SECRET, resave: true, saveUninitialized: true }))
  app.use(passport.session())
}

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

export { app }
