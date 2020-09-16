import { Router } from 'express'
import requestVerification from './request-verification'
import directChange from './direct-change'
import changeVerified from './verify-and-change'
import { EMAILS_ENABLE, NOTIFY_EMAIL_CHANGE, VERIFY_EMAILS } from '@shared/config'

if (NOTIFY_EMAIL_CHANGE && !EMAILS_ENABLE)
  console.warn(
    "NOTIFY_EMAIL_CHANGE has been enabled but SMTP is not enabled. Email change notifications won't be sent."
  )

const router = Router()

if (VERIFY_EMAILS) {
  router.post('/request', requestVerification)
  router.post('/change', changeVerified)
} else {
  router.post('/', directChange)
}

export default router
