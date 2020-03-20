import {
  SMTP_HOST,
  SMTP_PASS,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_SENDER,
  SMTP_USER
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
  }
})

/**
 * Reusable email client.
 */
export const emailClient = new Email({
  transport,
  message: { from: SMTP_SENDER },
  send: process.env.NODE_ENV === 'production',
  views: {
    root: path.resolve(process.env.PWD || '.', 'custom/emails'),
    options: {
      extension: 'ejs'
    }
  }
})
