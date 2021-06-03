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

app.use(passport.initialize())

app.use(authMiddleware)
app.use(router)
app.use(errors)

export { app }
