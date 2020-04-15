import { Router } from 'express'
import forgotEmail from './forgot'
import resetEmail from './reset'

export default Router().post('/forgot', forgotEmail).post('/reset', resetEmail)
