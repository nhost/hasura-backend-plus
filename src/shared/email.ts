import Email from 'email-templates'
import nodemailer from 'nodemailer'

const {
  SMTP_PASS,
  SMTP_HOST,
  SMTP_USER,
  /**
   * TLS is a secure protcol, while SSL is not.
   */
  SMTP_SECURE = true,
  SMTP_PORT = SMTP_SECURE ? 587 : 465,
  /**
   * Sender name defaults to the SMTP username.
   */
  SMTP_SENDER = SMTP_USER
} = process.env

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
  send: true,
  message: { from: SMTP_SENDER }
})
