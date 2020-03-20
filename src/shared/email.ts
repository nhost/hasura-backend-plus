import nodemailer from 'nodemailer'

interface Email {
  to: string
  text: string
  from?: string
  subject: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendEmail(options: Email): Promise<any> {
  const { to, text, from = '"noreply" <noreply@example.com>', subject } = options

  const testAccount = await nodemailer.createTestAccount()

  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  })

  const info = await transporter.sendMail({ from, to, subject, text })

  console.log('Message sent: %s', info.messageId)
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info))
}
