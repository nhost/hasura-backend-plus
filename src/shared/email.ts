import { APPLICATION } from '@shared/config'

import Email from 'email-templates'
import { request } from '@shared/request'
import nodemailer from 'nodemailer'
import ejs from 'ejs'
import { getEmailTemplate } from '@shared/queries'
import { QueryEmailTemplate } from '@shared/types'

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
export const emailClient: Email<any> = new Email({
  transport,
  message: { from: APPLICATION.SMTP_SENDER },
  send: APPLICATION.EMAILS_ENABLE,
  render: async (view, locals) => {
    const [id, field] = view.split('/')
    const locale = locals.locale

    const email = await request<QueryEmailTemplate>(getEmailTemplate, {
      id,
      locale
    }).then(query => query.auth_email_templates_by_pk)

    if(field === 'subject') return email.title
    else if(field === 'html') return await emailClient.juiceResources(ejs.render(email.html, locals))
    else if(field === 'text') return email.no_html
    else throw new Error(`Unknown field ${field}`)
  },
})
