import { MFA } from '@shared/config'
import { Router } from 'express'
import disableMfa from './disable'
import enableMfa from './enable'
import generateMfa from './generate'
import totpLogin from './totp'

const router = Router()

router.use((_, res, next) => {
  if (!MFA.ENABLED) {
    return res.boom.badImplementation(
      `Please set the MFA_ENABLED env variable to true to use the auth/mfa routes.`
    )
  } else {
    return next()
  }
})

export default router
  .post('/disable', disableMfa)
  .post('/enable', enableMfa)
  .post('/generate', generateMfa)
  .post('/totp', totpLogin)
