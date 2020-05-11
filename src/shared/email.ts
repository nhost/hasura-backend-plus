import {
  EMAILS_ENABLE,
  SMTP_HOST,
  SMTP_PASS,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_SENDER,
  SMTP_USER,
  SMTP_AUTH_METHOD
} from '@shared/config'

import Email from 'email-templates'
import nodemailer from 'nodemailer'
import path from 'path'

/**
 * SMTP transport.
 */
const transport = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: Boolean(SMTP_SECURE),
  auth: {
    pass: SMTP_PASS,
    user: SMTP_USER
  },
  authMethod: SMTP_AUTH_METHOD
})

/**
 * Reusable email client.
 */
export const emailClient = new Email({
  transport,
  message: { from: SMTP_SENDER },
  send: EMAILS_ENABLE,
  views: {
    root: path.resolve(process.env.PWD || '.', 'custom/emails'),
    options: {
      extension: 'ejs'
    }
  }
})
