import { MFA } from '@shared/config'
import { Router } from 'express'

import disableMfa from './sms-disable'
import enableSmsMfa from './sms-enable'
import generateSmsMfa from './sms-generate'
import resendSms from './sms-resend'

const router = Router()

router.use((req, res, next) => {
  if (!MFA.ENABLE) {
    return res.boom.badImplementation(
      `Please set the SMS_MFA_ENABLE env variable to true to use the auth/mfa routes.`
    )
  } else {
    return next()
  }
})

export const verificationMsg = (code: string): string => `Your verification code is: ${code}`

export default router
  .post('/disable', disableMfa)
  .post('/enable', enableSmsMfa)
  .post('/generate', generateSmsMfa)
  .post('/resend', resendSms)
