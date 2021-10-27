import { SMS_MFA } from '@shared/config'
import { Router } from 'express'

import generateSmsMfa from './sms-generate'
import disableSmsMfa from './sms-disable'
import enableSmsMfa from './sms-enable'
import resendSms from './sms-resend'
import totpSmsMfa from './sms-totp'

const router = Router()

router.use((_, res, next) => {
  if (!SMS_MFA.ENABLED) {
    return res.boom.badImplementation(
      `Please set the SMS_MFA_ENABLED env variable to true to use the auth/mfa routes.`
    )
  } else {
    return next()
  }
})

export const verificationMsg = (code: string): string => `Your verification code is: ${code}`

export default router
  .post('/generate', generateSmsMfa)
  .post('/disable', disableSmsMfa)
  .post('/enable', enableSmsMfa)
  .post('/resend', resendSms)
  .post('/totp', totpSmsMfa)
