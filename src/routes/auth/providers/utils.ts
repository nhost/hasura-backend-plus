import express, { Response, Router } from 'express'
import passport, { Profile } from 'passport'
import { VerifyCallback } from 'passport-oauth2'
import { Strategy } from 'passport'

import {
  PROVIDER_SUCCESS_REDIRECT,
  PROVIDER_FAILURE_REDIRECT,
  SERVER_URL,
  PROVIDERS,
  DEFAULT_USER_ROLE
} from '@shared/config'
import { insertAccount, selectAccountProvider } from '@shared/queries'
import { request } from '@shared/request'
import {
  InsertAccountData,
  QueryAccountProviderData,
  AccountData,
  UserData,
  RequestExtended
} from '@shared/types'
import { setRefreshToken } from '@shared/cookies'

interface Constructable<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): T
  prototype: T
}

export type TransformProfileFunction = <T extends Profile>(profile: T) => UserData
interface InitProviderSettings {
  transformProfile: TransformProfileFunction
  callbackMethod: 'GET' | 'POST'
}

const manageProviderStrategy = (
  provider: string,
  transformProfile: TransformProfileFunction
) => async (
  _req: RequestExtended,
  _accessToken: string,
  _refreshToken: string,
  profile: Profile,
  done: VerifyCallback
): Promise<void> => {
  // TODO How do we handle REGISTRATION_CUSTOM_FIELDS with OAuth?
  // find or create the user
  // check if user exists, using profile.id
  const { id, email, display_name, avatar_url } = transformProfile(profile)

  const hasuraData = await request<QueryAccountProviderData>(selectAccountProvider, {
    provider,
    profile_id: id
  })

  // IF user is already registered
  if (hasuraData.auth_account_providers.length > 0) {
    return done(null, hasuraData.auth_account_providers[0].account)
  }

  // ELSE, register user
  // TODO: why users are auto activated?
  // add account, account_provider and user
  const account_data = {
    email,
    password_hash: null,
    active: true,
    default_role: DEFAULT_USER_ROLE,
    account_roles: {
      data: [{ role: DEFAULT_USER_ROLE }]
    },
    user: { data: { display_name, avatar_url } },
    account_providers: {
      data: [
        {
          auth_provider: provider,
          auth_provider_unique_id: id
        }
      ]
    }
  }

  const hasura_account_provider_data = await request<InsertAccountData>(insertAccount, {
    account: account_data
  })

  return done(null, hasura_account_provider_data.insert_auth_accounts.returning[0])
}

const providerCallback = async (req: RequestExtended, res: Response): Promise<void> => {
  // Successful authentication, redirect home.
  // generate tokens and redirect back home

  // passport js defaults data to req.user.
  // However, we send account data.
  const account = req.user as AccountData

  let refresh_token = ''
  try {
    refresh_token = await setRefreshToken(res, account.id, true)
  } catch (e) {
    res.redirect(PROVIDER_FAILURE_REDIRECT as string)
  }

  // redirect back user to app url
  res.redirect(`${PROVIDER_SUCCESS_REDIRECT}?refresh_token=${refresh_token}`)
}

export const initProvider = <T extends Strategy>(
  router: Router,
  strategyName: string,
  strategy: Constructable<T>,
  settings: InitProviderSettings & ConstructorParameters<Constructable<T>>[0] // TODO: Strategy option type is not inferred correctly
): void => {
  const {
    transformProfile = ({ id, emails, displayName, photos }: Profile): UserData => ({
      id,
      email: emails?.[0].value,
      display_name: displayName,
      avatar_url: photos?.[0].value
    }),
    callbackMethod = 'GET',
    ...options
  } = settings
  passport.use(
    new strategy(
      {
        ...PROVIDERS[strategyName],
        ...options,
        callbackURL: `${SERVER_URL}/auth/providers/${strategyName}/callback`,
        passReqToCallback: true
      },
      manageProviderStrategy(strategyName, transformProfile)
    )
  )

  const subRouter = Router()

  subRouter.get('/', passport.authenticate(strategyName, { session: false }))

  const handlers = [
    passport.authenticate(strategyName, {
      failureRedirect: PROVIDER_FAILURE_REDIRECT,
      session: false
    }),
    providerCallback
  ]
  if (callbackMethod === 'POST') {
    // The Sign in with Apple auth provider requires a POST route for authentication
    subRouter.post('/callback', express.urlencoded(), ...handlers)
  } else {
    subRouter.get('/callback', ...handlers)
  }

  router.use(`/${strategyName}`, subRouter)
}
