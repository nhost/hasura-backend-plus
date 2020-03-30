import { Router } from 'express'
import resetEmail from './reset'
import forgotEmail from './forgot'

export default Router().post('/forgot', forgotEmail).post('/reset', resetEmail)
