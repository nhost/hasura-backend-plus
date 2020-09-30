import { COOKIE_SECRET, AUTH_HAS_ONE_PROVIDER, FIREBASE_AUTH_ENABLE } from '@shared/config'
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
import initializeFirebaseApp from '@shared/firebase'

const app = express()

if (process.env.NODE_ENV === 'production') {
  app.use(limiter)
}

app.use(morgan('tiny'))
app.use(helmet())
app.use(json())
app.use(cors({ credentials: true, origin: true }))
app.use(fileUpload())

if (AUTH_HAS_ONE_PROVIDER) {
  app.use(passport.initialize())
}

if (FIREBASE_AUTH_ENABLE) {
  initializeFirebaseApp()
}

/**
 * Set a cookie secret to enable server validation of cookies.
 */
if (COOKIE_SECRET) {
  app.use(cookieParser(COOKIE_SECRET))
} else {
  app.use(cookieParser())
}

app.use(authMiddleware)
app.use(router)
app.use(errors)

export { app }
