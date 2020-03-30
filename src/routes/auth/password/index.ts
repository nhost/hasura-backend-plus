import { Router } from 'express'

import resetPassword from './reset'
import forgotPassword from './forgot'

export default Router().post('/forgot', forgotPassword).post('/reset', resetPassword)
