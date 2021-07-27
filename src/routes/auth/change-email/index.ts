import { Router } from 'express'
import requestVerification from './request-verification'
import directChange from './direct-change'
import changeVerified from './verify-and-change'
import { APPLICATION, AUTHENTICATION } from '@shared/config'

if (AUTHENTICATION.NOTIFY_EMAIL_CHANGE && !APPLICATION.EMAILS_ENABLE)
  console.warn(
    "NOTIFY_EMAIL_CHANGE has been enabled but SMTP is not enabled. Email change notifications won't be sent."
  )

const router = Router()

router.use((req, res, next) => {
  if (!AUTHENTICATION.CHANGE_EMAIL_ENABLED) {
    return res.boom.badImplementation(
      `Please set the CHANGE_EMAIL_ENABLED env variable to true to use the auth/change-email routes.`
    )
  } else {
    return next()
  }
})

router.post('/request', requestVerification)
router.post('/change', changeVerified)
router.post('/', directChange)

export default router
