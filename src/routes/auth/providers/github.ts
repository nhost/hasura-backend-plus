import { Router, Request, Response } from 'express'
import passport from 'passport'
import passportGitHub, { Profile } from 'passport-github2'
import oauth2 from 'passport-oauth2'
import Boom from '@hapi/boom'
import {
  AccountProviderData,
  InsertAccountData,
  newRefreshExpiry,
  AccountData,
} from '@shared/helpers'
import { selectAccountProvider, insertAccount, insertRefreshToken } from '@shared/queries'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'

import {
  PROVIDERS_SUCCESS_REDIRECT,
  PROVIDERS_FAILURE_REDIRECT,
  AUTH_GITHUB_CLIENT_ID,
  AUTH_GITHUB_CLIENT_SECRET,
  AUTH_GITHUB_CALLBACK_URL,
  AUTH_GITHUB_AUTHORIZATION_URL,
  AUTH_GITHUB_TOKEN_URL,
  AUTH_GITHUB_USER_PROFILE_URL,
  COOKIE_SECRET,
} from '@shared/config'

const router = Router()
const GitHubStrategy = passportGitHub.Strategy

passport.use(
  new GitHubStrategy(
    {
      clientID: AUTH_GITHUB_CLIENT_ID as 'string',
      clientSecret: AUTH_GITHUB_CLIENT_SECRET as 'string',
      callbackURL: AUTH_GITHUB_CALLBACK_URL as 'string',
      authorizationURL: AUTH_GITHUB_AUTHORIZATION_URL as 'string',
      tokenURL: AUTH_GITHUB_TOKEN_URL as 'string',
      userProfileURL: AUTH_GITHUB_USER_PROFILE_URL as 'string',
      scope: ['user:email'],
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: (error: null, user: AccountData) => void
    ) => {
      // TODO: possible check REDIRECT_URLS not undefined?

      console.log('github function')
      console.log('accessToken:')
      console.log({ accessToken })
      console.log('refreshToken:')
      console.log({ refreshToken })
      console.log('profile:')
      console.log({ profile })
      let account

      // find or create the user
      // check if user exists, using profile.id
      const hasuraData = (await request(selectAccountProvider, {
        provider: 'github',
        profile_id: profile.id,
      })) as AccountProviderData

      console.log(' hasura data on selectAccountProvider')
      console.log({ hasuraData })

      // IF user is already registerd
      if (hasuraData.auth_account_providers.length > 0) {
        account = hasuraData.auth_account_providers[0].account
        return done(null, account)
      }

      // ELSE, registe ruser

      // get email from provider
      let account_email = null
      if (profile.emails) {
        account_email = profile.emails[0].value
      }

      // get avatar url from provider
      let avatar_url = null
      if (profile.photos) {
        avatar_url = profile.photos[0].value
      }

      // add account, account_provider and user
      const account_data = {
        email: account_email,
        password_hash: null,
        active: true,
        user: {
          data: {
            display_name: profile.displayName,
            avatar_url: avatar_url,
          },
        },
        account_providers: {
          data: [
            {
              auth_provider: 'github',
              auth_provider_unique_id: profile.id,
            },
          ],
        },
      }

      let hasura_account_provider_data
      try {
        hasura_account_provider_data = (await request(insertAccount, {
          account: account_data,
        })) as InsertAccountData
      } catch (err) {
        console.error(err)
        throw Boom.badImplementation()
      }

      account = hasura_account_provider_data.insert_auth_accounts.returning[0]

      return done(null, account)
    }
  )
)

router.get(
  '/',
  passport.authenticate('github', {
    session: false,
  })
)

router.get(
  '/callback',
  passport.authenticate('github', {
    failureRedirect: PROVIDERS_FAILURE_REDIRECT,
    session: false,
  }),
  async function (req: Request, res: Response) {
    // Successful authentication, redirect home.
    // generate tokens and redirect back home

    // passport js defaults data to req.user.
    // However, we send account data.
    const account = req.user as AccountData

    console.log('in call back')
    console.log('account is now:')
    console.log({ account })

    const refresh_token = uuidv4()

    try {
      await request(insertRefreshToken, {
        refresh_token_data: {
          account_id: account.id,
          refresh_token,
          expires_at: new Date(newRefreshExpiry()),
        },
      })
    } catch (err) {
      throw Boom.badImplementation()
    }

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      maxAge: newRefreshExpiry(),
      signed: Boolean(COOKIE_SECRET),
      expires: new Date(newRefreshExpiry()),
    })

    console.log('redirec to:')
    console.log(PROVIDERS_SUCCESS_REDIRECT)

    res.redirect(PROVIDERS_SUCCESS_REDIRECT as string)
  }
)

export default router
