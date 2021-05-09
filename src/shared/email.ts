import { APPLICATION } from '@shared/config'

import Email from 'email-templates'
import nodemailer from 'nodemailer'
import path from 'path'

/**
 * SMTP transport.
 */
const transport = nodemailer.createTransport({
  host: APPLICATION.SMTP_HOST,
  port: Number(APPLICATION.SMTP_PORT),
  secure: Boolean(APPLICATION.SMTP_SECURE),
  auth: {
    pass: APPLICATION.SMTP_PASS,
    user: APPLICATION.SMTP_USER
  },
  authMethod: APPLICATION.SMTP_AUTH_METHOD
})

/**
 * Reusable email client.
 */
export const emailClient = new Email({
  transport,
  message: { from: APPLICATION.SMTP_SENDER },
  send: APPLICATION.EMAILS_ENABLE,
  views: {
    root: path.resolve(process.env.PWD || '.', 'custom/emails'),
    options: {
      extension: 'ejs'
    }
  }
})
