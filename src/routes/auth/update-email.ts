import { Response } from 'express'
import { request } from '@shared/request'
import { RequestExtended } from '@shared/types'
import { asyncWrapper, verifySignature } from '@shared/helpers'
import { getAccountByWalletAddress, updateArtistClaimEmail, updateEmailAddressForSignUp } from '@shared/queries'
import { AccountData } from '@shared/types'
import { APPLICATION, COOKIES } from '@shared/config'
import { emailClient } from '@shared/email'
import { v4 as uuidv4 } from 'uuid'

interface UpdateEmailRequest {
  email: string
  address: string
  signature: string
  next_url?: string
}

async function updateEmail(req: RequestExtended, res: Response): Promise<unknown> {

  if(!verifySignature(req))
  {
    return res.boom.badImplementation('Invalid Session')
  }

  const {address, email, next_url} = req.body as UpdateEmailRequest

  if(!address || !email) {
      return res.boom.badImplementation('Invalid Parameters')
  }

  const accountResponse = await request<{auth_accounts: AccountData[]}>(getAccountByWalletAddress, {address: address.toLowerCase()})
  let account = null

  if(accountResponse.auth_accounts.length === 0) {
    return res.send({success: false, error: "You are not a registered user, Please sign up."})
  } else {
    account = accountResponse.auth_accounts[0]
  }

  const {
    active,
    user: {
      username
    }
  } = account

  if (active) {
    res.send({success: false, error: "You are already active, Please login"})
  }
  const cookiesInUse = COOKIES.SECRET ? req.signedCookies : req.cookies
  const updateEmailLimit = parseInt(cookiesInUse['update_email_limit'] || 0) + 1
  if(updateEmailLimit > 3) {
    return res.send({success: false,  error: 'Too many requests, Please try again 1 hour later'})
  }

  const ticket = uuidv4()
  const ticket_expires_at = new Date(+new Date() + 60 * 60 * 1000).toISOString()

  let activateUrl = `${APPLICATION.SERVER_URL}/auth/activate?ticket=${ticket}`
    if (next_url && next_url !== undefined && next_url !== 'undefined') activateUrl = `${activateUrl}&nextURL=${next_url}`

  let locals : {
    display_name: string
    url: string

  } = {
    display_name: username!,
    url: activateUrl,
  }

  try {
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
      locals
    })
  } catch (err) {
    return  res.send({success: false,  error: 'Error in sending Email.'})
  }

  await request(updateEmailAddressForSignUp, {address: address.toLowerCase(), email, ticket_expires_at, ticket})
  
  const artistClaimId = account?.user.artist_royalty_claims?.[0]?.id
  if(artistClaimId) {
    await request(updateArtistClaimEmail, {id: artistClaimId, email})
  }

  res.cookie('nonce', null)
  
  const maxAge = 60 * 60 * 1000
  res.cookie('update_email_limit', updateEmailLimit, {
    httpOnly: true,
    maxAge,
    signed: Boolean(COOKIES.SECRET),
    sameSite: COOKIES.SAME_SITE,
    secure: COOKIES.SECURE
  })

  return res.send({success: true})
}

export default asyncWrapper(updateEmail)
