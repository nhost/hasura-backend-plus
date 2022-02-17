import { COOKIES } from '@shared/config'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { errors } from './errors'
import express from 'express'
import fileUpload from 'express-fileupload'
import helmet from 'helmet'
import { json } from 'body-parser'
import morgan from 'morgan'
import { limiter } from './limiter'
import router from './routes'
import passport from 'passport'
import { authMiddleware } from './middlewares/auth'
import session from 'express-session'
const PgSimple = require('connect-pg-simple')

const app = express()

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1)
  app.use(limiter)
}

app.use(
  morgan(
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]'
  )
)
app.use(helmet())
app.use(json())
app.use(cors({ credentials: true, origin: true }))
app.use(fileUpload())

const pgSession = PgSimple(session)
app.use(
  session({
    store: new pgSession({
      conString: process.env.DATABASE_URL,
      schemaName: 'public',
      tableName: 'session'
    }),
    secret: COOKIES.SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: COOKIES.SECURE,
      sameSite: COOKIES.SAME_SITE,
      maxAge: 30 * 24 * 60 * 60 * 1000
    }
  })
)

app.use(passport.initialize())

/**
 * Set a cookie secret to enable server validation of cookies.
 */
if (COOKIES.SECRET) {
  app.use(cookieParser(COOKIES.SECRET))
} else {
  app.use(cookieParser())
}

app.use(authMiddleware)
app.use(router)
app.use(errors)

export { app }
