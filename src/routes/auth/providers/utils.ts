import { Request, Response } from 'express'
import { Profile } from 'passport'
import { VerifyCallback } from 'passport-oauth2'
import Boom from '@hapi/boom'

import { insertAccount, selectAccountProvider } from '@shared/queries'
import { request } from '@shared/request'
import { InsertAccountData, AccountProviderData, AccountData } from '@shared/helpers'
import { PROVIDERS_SUCCESS_REDIRECT } from '@shared/config'
import { setRefreshToken } from '@shared/jwt'
import { registerUserDataSchema } from '@shared/schema'

type Providers = 'github'

export const manageProviderStrategy = (provider: Providers) => async (
  { body }: Request,
  _accessToken: string,
  _refreshToken: string,
  profile: Profile,
  done: VerifyCallback
): Promise<void> => {
  // TODO: possible check REDIRECT_URLS not undefined?

  const { user_data } = await registerUserDataSchema.validateAsync(body)
  // find or create the user
  // check if user exists, using profile.id
  const hasuraData = (await request(selectAccountProvider, {
    provider: 'github',
    profile_id: profile.id
  })) as AccountProviderData

  // IF user is already registerd
  if (hasuraData.auth_account_providers.length > 0) {
    return done(null, hasuraData.auth_account_providers[0].account)
  }

  // ELSE, register user

  // TODO: why users are auto activated?
  // add account, account_provider and user
  const account_data = {
    email: profile.emails?.[0].value,
    password_hash: null,
    active: true,
    user: {
      data: {
        display_name: profile.displayName,
        avatar_url: profile.photos?.[0].value,
        ...user_data
      }
    },
    account_providers: {
      data: [
        {
          auth_provider: provider,
          auth_provider_unique_id: profile.id
        }
      ]
    }
  }

  let hasura_account_provider_data
  try {
    hasura_account_provider_data = (await request(insertAccount, {
      account: account_data
    })) as InsertAccountData
  } catch (err) {
    throw Boom.badImplementation()
  }

  return done(null, hasura_account_provider_data.insert_auth_accounts.returning[0])
}

export const providerCallback = async (req: Request, res: Response): Promise<void> => {
  // Successful authentication, redirect home.
  // generate tokens and redirect back home

  // passport js defaults data to req.user.
  // However, we send account data.
  const account = req.user as AccountData

  await setRefreshToken(res, account.id)

  // redirect back user to app url
  res.redirect(PROVIDERS_SUCCESS_REDIRECT as string)
}
