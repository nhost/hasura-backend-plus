import { Response } from 'express'
import { request } from '@shared/request'
import { AccountData, RequestExtended } from '@shared/types'
import { asyncWrapper, selectAccountByUserId, selectProviderByWallet, verifySignature } from '@shared/helpers'
import { insertAccountProviderWithUserAccount, setWallet } from '@shared/queries'


interface WalletAttachRequest {
  user_id: string
  address: string
  signature: string
}
async function walletAttach(req: RequestExtended, res: Response): Promise<unknown> {

  if(!verifySignature(req))
  {
    return res.boom.badImplementation('Invalid Session')
  }

  const user_id = req.permission_variables?.["user-id"]
  const {address} = req.body as WalletAttachRequest

  //check if email already exists
  const selectedAccount = await selectAccountByUserId(user_id)
  if (!selectedAccount) {
    return res.boom.badRequest('Account does not exist.')
  }
  
  //validate if wallet already exists
  const selectProvider = await selectProviderByWallet(address)

  if (selectProvider) {
    return res.boom.badRequest('Wallet already exists.')
  }
  

  try {

    await request<{insert_auth_account_providers_one: {account:AccountData}}>(insertAccountProviderWithUserAccount, {
      account_provider: {
        auth_provider_unique_id: address, 
        auth_provider: "wallet",
        account_id:selectedAccount.id
      }
    })

    //associal wallets table
    await request<{user_id:string, address:string}>(setWallet, {user_id:selectedAccount.user.id, address:address.replace("0x", "\\x")})

  } catch (e) {
    console.log(e)
    return res.boom.badRequest('Error inserting wallet')
  }

  res.cookie('nonce', null) //empty nonce
  return res.send()
}

export default asyncWrapper(walletAttach)
