import { Request, Response } from 'express'
import { asyncWrapper } from '@shared/helpers'
import { COOKIE_SECRET } from '@shared/config'
import { request } from '@shared/request'
import { deleteRefreshToken } from '@shared/queries'

async function logout({ cookies, signedCookies }: Request, res: Response): Promise<unknown> {
  // get refresh token
  const { refresh_token } = COOKIE_SECRET ? signedCookies : cookies

  // delete refresh token
  try {
    await request(deleteRefreshToken, {
      refresh_token
    })
  } catch (error) {
    console.log('no tokens was deleted')
    // noop
    // we don't really care if anything get's deleted or not
  }

  // clear cookie
  res.clearCookie('refresh_token')

  // return 204
  return res.status(204).send()
}

export default asyncWrapper(logout)
