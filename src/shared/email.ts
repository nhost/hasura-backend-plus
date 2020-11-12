import {
  EMAILS_ENABLE,
  SMTP_HOST,
  SMTP_PASS,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_SENDER,
  SMTP_USER,
  SMTP_AUTH_METHOD, EMAILS_SERVICE
} from '@shared/config'

import Email from 'email-templates'
import nodemailer from 'nodemailer'
import path from 'path'

/**
 * SMTP transport.
 */
const transportOptions = {
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: Boolean(SMTP_SECURE),
  service: EMAILS_SERVICE,
  auth: {
    pass: SMTP_PASS,
    user: SMTP_USER
  },
  authMethod: SMTP_AUTH_METHOD
}
const transport = nodemailer.createTransport(transportOptions)

/**
 * Reusable email client.
 */
const emailClientConfig = {
  transport,
  message: { from: SMTP_SENDER },
  send: EMAILS_ENABLE,
  views: {
    root: path.resolve(process.env.PWD || '.', 'custom/emails'),
    options: {
      extension: 'ejs'
    }
  }
}
export const emailClient = new Email(emailClientConfig)
