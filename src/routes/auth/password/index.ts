import { Router } from 'express'
import forgotPassword from './forgot'
import resetPassword from './reset'

export default Router().post('/forgot', forgotPassword).post('/reset', resetPassword)
