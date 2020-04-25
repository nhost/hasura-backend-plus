import { Router } from 'express'
import request from './request'
import change from './change'
import { SMTP_ENABLE, NOTIFY_EMAIL_CHANGE } from '@shared/config'

if (NOTIFY_EMAIL_CHANGE && !SMTP_ENABLE)
  console.warn(
    "NOTIFY_EMAIL_CHANGE has been enabled but SMTP is not enabled. Email change notifications won't be sent."
  )

export default Router().post('/request', request).post('/change', change)
