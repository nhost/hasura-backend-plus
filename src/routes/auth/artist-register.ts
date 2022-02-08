import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { request } from '@shared/request'
import { emailClient } from '@shared/email'
import { insertArtistRoyaltyClaim } from '@shared/queries'
import { APPLICATION } from '@shared/config'
require('dotenv').config()

async function artistRegister(req: Request, res: Response) {
  
  const body = req.body

  const { token } = body;
  let passCaptcha = false
  if (token) {
    const response = await fetch(
      `https://hcaptcha.com/siteverify`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
        },
        body: `response=${token}&secret=${process.env.HCAPTCHA_SECRET_KEY}`,
        method: "POST",
      }
    );
    const captchaValidation = await response.json();
    passCaptcha = captchaValidation.success
    delete body.token
  }

  if (!passCaptcha && process.env.DEVELOPMENT !== 'dev') return res.boom.badRequest('Unable to sign up user')

  const active_link = uuidv4()
  const active_link_expires_at = new Date(+new Date() + 60 * 60 * 1000).toISOString() // active for 60 minutes

  try {
    await request(insertArtistRoyaltyClaim, {object: {
      ...body,
      active_link,
      active_link_expires_at
    }});
  } catch (err) {
    return res.boom.badRequest(err.message)
  }

  try {
    await emailClient.send({
      template: 'artist-register',
      message: {
        to: body.email,
        headers: {
          'x-ticket': {
            prepared: true,
            value: active_link
          }
        },
      },
      locals: {
        url: `${APPLICATION.SERVER_URL}/artist/${active_link}`,
      }
    })
    res.send({ success: true })
  } catch (err) {
    console.error('Unable to send email')
    console.error(err)
    return res.boom.badImplementation()
  }

}

export default artistRegister
