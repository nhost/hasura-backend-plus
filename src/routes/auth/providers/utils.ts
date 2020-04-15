import { Request, Response, Router } from 'express'
import passport, { Profile } from 'passport'
import { VerifyCallback } from 'passport-oauth2'
import { Strategy } from 'passport'
import Boom from '@hapi/boom'

import { insertAccount, selectAccountProvider } from '@shared/queries'
import { request } from '@shared/request'
import { InsertAccountData, AccountProviderData, AccountData } from '@shared/helpers'
import { PROVIDERS_SUCCESS_REDIRECT, PROVIDERS_FAILURE_REDIRECT, SERVER_URL } from '@shared/config'
import * as _config from '@shared/config'

import { setRefreshToken } from '@shared/jwt'

const manageProviderStrategy = (provider: string) => async (
  _req: Request,
  _accessToken: string,
  _refreshToken: string,
  profile: Profile,
  done: VerifyCallback
): Promise<void> => {
  // TODO How do we handle AUTH_REGISTRATION_FIELDS with OAuth?
  // find or create the user
  // check if user exists, using profile.id
  const hasuraData = (await request(selectAccountProvider, {
    provider,
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
        avatar_url: profile.photos?.[0].value
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

const providerCallback = async (req: Request, res: Response): Promise<void> => {
  // Successful authentication, redirect home.
  // generate tokens and redirect back home

  // passport js defaults data to req.user.
  // However, we send account data.
  const account = req.user as AccountData

  await setRefreshToken(res, account.id)

  // redirect back user to app url
  res.redirect(PROVIDERS_SUCCESS_REDIRECT as string)
}

interface Constructable<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): T
  prototype: T
}

const config = (_config as unknown) as Record<string, boolean | string>

export const initProvider = <T extends Strategy>(
  router: Router,
  strategyName: string,
  strategy: Constructable<T>,
  options: ConstructorParameters<Constructable<T>>[0] // TODO: Strategy option type is not inferred correctly
): void => {
  // Strategy name in capitals, to get the configuration
  const capsStragegy = strategyName.toUpperCase()
  // Checks if the strategy is enabled. Don't create any route otherwise
  if (config[`AUTH_${capsStragegy}_ENABLE`] as boolean) {
    const clientID = config[`AUTH_${capsStragegy}_CLIENT_ID`]
    const clientSecret = config[`AUTH_${capsStragegy}_CLIENT_SECRET`]
    // Checks if the strategy has at least a client ID and a client secret
    if (!clientID || !clientSecret) {
      throw Boom.badImplementation(`Missing environment variables for ${strategyName} OAuth.`)
    }

    passport.use(
      new strategy(
        {
          ...options,
          clientID,
          clientSecret,
          callbackURL:
            config[`AUTH_${capsStragegy}_CALLBACK_URL`] ||
            `${SERVER_URL}/auth/providers/${strategyName}/callback`,
          passReqToCallback: true
        },
        manageProviderStrategy(strategyName)
      )
    )

    const subRouter = Router()
    subRouter.get('/', passport.authenticate(strategyName, { session: false }))

    subRouter.get(
      '/callback',
      passport.authenticate(strategyName, {
        failureRedirect: PROVIDERS_FAILURE_REDIRECT,
        session: false
      }),
      providerCallback
    )
    router.use(`/${strategyName}`, subRouter)
  }
}
