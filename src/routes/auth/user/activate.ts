import { Request, Response } from 'express';

import Boom from '@hapi/boom';
import { activateSchema } from '@shared/schema';
import { activateUser } from '@shared/queries';
import { asyncWrapper } from '@shared/helpers';
import { request } from '@shared/request';
import { v4 as uuidv4 } from 'uuid';

async function activate({ body }: Request, res: Response) {
  let hasuraData: { update_users: { affected_rows: number } };

  const { ticket } = await activateSchema.validateAsync(body);

  try {
    hasuraData = await request(activateUser, {
      ticket,
      now: new Date(),
      new_ticket: uuidv4(),
    });
  } catch (err) {
    throw Boom.badImplementation();
  }

  const { affected_rows } = hasuraData.update_users;

  if (affected_rows === 0) {
    throw Boom.unauthorized('Secret token does not match.');
  }

  return res.status(204).send();
}

export default asyncWrapper(activate);
