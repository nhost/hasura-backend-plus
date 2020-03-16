import { Request, Response } from 'express';
import { asyncWrapper, createJwt, newJwtExpiry, newRefreshExpiry, signed } from '@shared/helpers';
import { insertRefreshToken, rotateTicket, selectUserByTicket } from '@shared/queries';

import Boom from '@hapi/boom';
import { authenticator } from 'otplib';
import { request } from '@shared/request';
import { totpSchema } from '@shared/schema';
import { v4 as uuidv4 } from 'uuid';

async function totp({ body }: Request, res: Response) {
  let hasuraData: { private_user_accounts: any[] };

  const { ticket, code } = await totpSchema.validateAsync(body);

  try {
    hasuraData = await request(selectUserByTicket, { ticket });
  } catch (err) {
    throw Boom.badImplementation();
  }

  const hasuraUser: {
    user: {
      id: string
      ticket: string
      active: boolean
    }
    otp_secret: string
    mfa_enabled: boolean
  }[] = hasuraData.private_user_accounts;

  if (hasuraUser.length === 0) {
    throw Boom.badRequest('User does not exist.');
  }

  const {
    otp_secret,
    mfa_enabled,
    user: { id, active },
  } = hasuraUser[0];

  if (!mfa_enabled) {
    throw Boom.badRequest('MFA is not enabled.');
  }

  if (!active) {
    throw Boom.badRequest('User not activated.');
  }

  if (!authenticator.check(code, otp_secret)) {
    throw Boom.unauthorized('Invalid two-factor code.');
  }

  const refresh_token = uuidv4();

  try {
    await request(insertRefreshToken, {
      refresh_token_data: {
        user_id: id,
        refresh_token,
        expires_at: new Date(newRefreshExpiry()),
      },
    });

    /**
     * Rotate user ticket.
     */
    await request(rotateTicket, {
      ticket,
      now: new Date(),
      new_ticket: uuidv4(),
    });
  } catch (err) {
    throw Boom.badImplementation();
  }

  res.cookie('refresh_token', refresh_token, {
    httpOnly: true,
    signed: Boolean(signed),
    maxAge: newRefreshExpiry(),
  });

  return res.send({
    jwt_token: createJwt(id),
    jwt_expires_in: newJwtExpiry,
  });
}

export default asyncWrapper(totp);
