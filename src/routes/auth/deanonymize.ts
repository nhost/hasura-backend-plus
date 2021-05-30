import { Response } from 'express'
import { APPLICATION, AUTHENTICATION, REGISTRATION } from "@shared/config";
import { accountIsAnonymous, accountWithEmailExists, asyncWrapper, checkHibp, hashPassword, deanonymizeAccount as deanonymizeAccountHelper, selectAccountByUserId } from "@shared/helpers";
import { deanonymizeSchema } from '@shared/validation';
import { RequestExtended } from '@shared/types';
import { request } from '@shared/request';
import { setNewTicket } from '@shared/queries';
import { emailClient } from '@shared/email';
import cryptr from '@shared/cryptr'

async function deanonymizeAccount(req: RequestExtended, res: Response): Promise<unknown> {
  const body = req.body

  if(!AUTHENTICATION.ANONYMOUS_USERS_ENABLE) {
    return res.boom.badImplementation(`Please set the ANONYMOUS_USERS_ENABLE env variable to true to use the auth/deanonymize route.`)
  }

  if (!req.permission_variables || !await accountIsAnonymous(req.permission_variables['user-id'])) {
    return res.boom.unauthorized('Unable to deanonymize account')
  }

  const {
    email,
    password,
  } = await deanonymizeSchema.validateAsync(body)

  try {
    await checkHibp(password)
  } catch (err) {
    return res.boom.badRequest(err.message)
  }

  let passwordHash: string
  try {
    passwordHash = await hashPassword(password)
  } catch (err) {
    return res.boom.internal(err.message)
  }

  if (await accountWithEmailExists(email)) {
    return res.boom.badRequest('Cannot use this email.')
  }

  if(REGISTRATION.AUTO_ACTIVATE_NEW_USERS) {
    await deanonymizeAccountHelper(
      await selectAccountByUserId(req.permission_variables['user-id']).then(acc => acc.id),
      email,
      passwordHash,
    )
  } else {
    const ticket = cryptr.encrypt(`${email}\0${passwordHash}`) // will be decrypted on the auth/activate call
    const ticket_expires_at = new Date(+new Date() + 60 * 60 * 1000) // active for 60 minutes

    await request(setNewTicket, {
      user_id: req.permission_variables['user-id'],
      ticket,
      ticket_expires_at
    })

    await emailClient.send({
      template: 'activate-account',
      message: {
        to: email,
        headers: {
          'x-ticket': {
            prepared: true,
            value: ticket
          }
        }
      },
      locals: {
        display_name: email,
        ticket,
        url: APPLICATION.SERVER_URL
      }
    })
  }

  return res.status(204).send()
}

export default asyncWrapper(deanonymizeAccount)
