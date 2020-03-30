import { Router } from 'express'

import totpLogin from './totp'
import enableMfa from './enable'
import disableMfa from './disable'
import generateMfa from './generate'

export default Router()
  .post('/disable', disableMfa)
  .post('/enable', enableMfa)
  .post('/generate', generateMfa)
  .post('/totp', totpLogin)
