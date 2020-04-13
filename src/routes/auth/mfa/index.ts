import { Router } from 'express'
import disableMfa from './disable'
import enableMfa from './enable'
import generateMfa from './generate'
import totpLogin from './totp'

export default Router()
  .post('/disable', disableMfa)
  .post('/enable', enableMfa)
  .post('/generate', generateMfa)
  .post('/totp', totpLogin)
