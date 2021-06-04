import { Response } from 'express'
import { RequestExtended } from '@shared/types';
import { request } from '@shared/request';
import { asyncWrapper } from '@shared/helpers';
import { changeLocaleByUserId } from '@shared/queries';
import { localeQuery } from '@shared/validation';

async function changeLocale(req: RequestExtended, res: Response): Promise<unknown> {
  if(!req.permission_variables) {
    return res.boom.unauthorized('Not logged in')
  }

  const { locale } = await localeQuery.validateAsync(req.body)

  await request(changeLocaleByUserId, {
    user_id: req.permission_variables['user-id'],
    locale: locale
  })

  return res.status(204).send()
}

export default asyncWrapper(changeLocale)
