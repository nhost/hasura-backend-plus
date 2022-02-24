import express, { RequestHandler, Response, Router } from 'express'
import passport, { Profile } from 'passport'
import { VerifyCallback } from 'passport-oauth2'
import { Strategy } from 'passport'

import { PROVIDERS, APPLICATION, REGISTRATION } from '@shared/config'
import {
  insertAccount,
  insertAccountProviderToUser,
  selectAccountProvider,
  selectUserByUsername,
  updateAccountProviderToUser
} from '@shared/queries'
import { getEndURLOperator, selectAccountByEmail, selectAccountByUserId } from '@shared/helpers'
import { request } from '@shared/request'
import {
  InsertAccountData,
  QueryAccountProviderData,
  AccountData,
  UserData,
  RequestExtended,
  InsertAccountProviderToUser,
  QueryUserData,
  UpdateAccountProviderToUser
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
  transformProfile: TransformProfileFunction,
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
  const anyProfile = profile as any
  let rawProfile = anyProfile._raw || anyProfile

  const hasuraData = await request<QueryAccountProviderData>(selectAccountProvider, {
    provider,
    profile_id: id
  })

  // IF user is already registered
  if (hasuraData.auth_account_providers.length > 0) {
    await request<UpdateAccountProviderToUser>(updateAccountProviderToUser, {
      account_provider: {
          raw_data: rawProfile,
          auth: {
            _accessToken,
            _refreshToken
          }
      },
      auth_provider_unique_id: id,
    })

    return done(null, hasuraData.auth_account_providers[0].account)

  }

  // See if email already exist.
  // if email exist, merge this provider with the current user.
  try {
    // try fetching the account using email
    // if we're unable to fetch the account using the email
    // we'll throw out of this try/catch
    let account = await selectAccountByUserId(_req.permission_variables?.['user-id'])
    if (!account) account = await selectAccountByEmail(email as string)

    // account was successfully fetched
    // add provider and activate account
    const insertAccountProviderToUserData = await request<InsertAccountProviderToUser>(
      insertAccountProviderToUser,
      {
        account_provider: {
          account_id: account.id,
          auth_provider: provider,
          auth_provider_unique_id: id,
          raw_data: rawProfile,
          auth: {
            _accessToken,
            _refreshToken
          }
        },
        account_id: account.id
      }
    )
    return done(null, insertAccountProviderToUserData.insert_auth_account_providers_one.account)
  } catch (error) {
    // We were unable to fetch the account
    // noop continue to register user
  }

  let username = profile.username ? profile.username.trim().toLowerCase() : undefined

  const generateRandomSequence = () => {
    return (Math.floor(Math.random() * 10000) + 10000).toString().substring(1)
  }

  if (username) {
    const usernameAlreadyTaken: boolean = await request<QueryUserData>(selectUserByUsername, {
      username
    }).then((res) => !!res.users.length)

    if (usernameAlreadyTaken) {
      const appendRandomSequence = (input: string) => {
        return input + generateRandomSequence()
      }

      username = appendRandomSequence(display_name)
    }
  } else {
    username = generateRandomSequence() + generateRandomSequence() + generateRandomSequence()
  }

  // register user, account, account_provider
  const account_data = {
    email,
    password_hash: null,
    active: true,
    default_role: REGISTRATION.DEFAULT_USER_ROLE,

    account_roles: {
      data: REGISTRATION.DEFAULT_ALLOWED_USER_ROLES.map((role) => ({ role }))
    },
    user: {
      data: {
        display_name: display_name || email,
        avatar_url,
        username
      }
    },
    account_providers: {
      data: [
        {
          auth_provider: provider,
          auth_provider_unique_id: id,
          raw_data: rawProfile,
          auth: {
            _accessToken,
            _refreshToken
          }
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
    res.redirect(PROVIDERS.REDIRECT_FAILURE)
  }

  const url_operator = getEndURLOperator({
    url: APPLICATION.REDIRECT_URL_SUCCESS
  })

  // Redirect user with refresh token.
  // This is both for when users log in and register.
  return res.redirect(
    `${APPLICATION.REDIRECT_URL_SUCCESS}${url_operator}refresh_token=${refresh_token}`
  )
}

export const initProvider = <T extends Strategy>(
  router: Router,
  strategyName:
    | 'github'
    | 'google'
    | 'facebook'
    | 'twitter'
    | 'linkedin'
    | 'apple'
    | 'windowslive'
    | 'spotify',
  strategy: Constructable<T>,
  settings: InitProviderSettings & ConstructorParameters<Constructable<T>>[0], // TODO: Strategy option type is not inferred correctly
  middleware?: RequestHandler
): void => {
  const {
    transformProfile = ({ id, emails, displayName, photos }: Profile): UserData => {
      const userData: UserData = {
        id,
        display_name: displayName
      }

      if (emails?.length && emails?.[0].value) userData['email'] = emails[0].value
      if (photos?.length && photos?.[0].value) userData['avatar_url'] = photos[0].value

      return userData
    },
    callbackMethod = 'GET',
    ...options
  } = settings

  const subRouter = Router()

  if (middleware) {
    subRouter.use(middleware)
  }

  let registered = false

  subRouter.use((req: RequestExtended, res, next) => {
    if (!registered) {
      passport.use(
        new strategy(
          {
            ...PROVIDERS[strategyName],
            ...options,
            callbackURL: `${APPLICATION.SERVER_URL}/auth/providers/${strategyName}/callback`,
            passReqToCallback: true
          },
          manageProviderStrategy(strategyName, transformProfile)
        )
      )

      registered = true
    }
    next()
  })

  subRouter.get('/', passport.authenticate(strategyName, { session: false }))

  const handlers = [
    passport.authenticate(strategyName, {
      failureRedirect: PROVIDERS.REDIRECT_FAILURE,
      session: false
    }),
    providerCallback
  ]
  if (callbackMethod === 'POST') {
    // The Sign in with Apple auth provider requires a POST route for authentication
    subRouter.post('/callback', express.urlencoded({ extended: true }), ...handlers)
  } else {
    subRouter.get('/callback', ...handlers)
  }

  router.use(`/${strategyName}`, subRouter)
}
