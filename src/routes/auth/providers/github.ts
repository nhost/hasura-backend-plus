import { Router, Request, Response } from 'express'
import passport from 'passport'
import passportGitHub, { Profile } from 'passport-github2'
import oauth2 from 'passport-oauth2'
import Boom from '@hapi/boom'
import { HasuraAccountProviderData } from '@shared/helpers'
import { selectAccountProvider, insertAccount } from '@shared/queries'
import { request } from '@shared/request'

import {
  // PROVIDERS_SUCCESS_REDIRECT,
  PROVIDERS_FAILURE_REDIRECT,
  AUTH_GITHUB_CLIENT_ID,
  AUTH_GITHUB_CLIENT_SECRET,
  AUTH_GITHUB_CALLBACK_URL,
  AUTH_GITHUB_AUTHORIZATION_URL,
  AUTH_GITHUB_TOKEN_URL,
  AUTH_GITHUB_USER_PROFILE_URL
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
      scope: ['user:email']
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: oauth2.VerifyCallback
    ) => {
      const user = {}

      // find or create the user
      // check if user exists, using profile.id
      const hasuraData = (await request(selectAccountProvider, {
        provider: 'github',
        profile_id: profile.id
      })) as HasuraAccountProviderData

      // if user does not exists
      if (hasuraData.auth_account_providers.length === 0) {
        // create the user

        // get email
        let account_email = null
        if (profile.photos) {
          account_email = profile.photos[0].value
        }

        // get avatar url
        let avatar_url = null
        if (profile.photos) {
          avatar_url = profile.photos[0].value
        }

        try {
          await request(insertAccount, {
            account: {
              email: account_email,
              password_hash: null,
              user: {
                data: {
                  display_name: profile.displayName,
                  avatar_url: avatar_url
                }
              }
            }
          })
        } catch (err) {
          console.error(err)
          throw Boom.badImplementation()
        }
      }

      console.log({ hasuraData })

      return done(null, user)
      // console.log({ accessToken })
      // console.log({ refreshToken })
      // console.log({ profile })
      // done(null, {
      //   lol: 'boll'
      // })
    }
  )
)

router.get(
  '/',
  passport.authenticate('github', {
    session: false
  })
)

router.get(
  '/callback',
  passport.authenticate('github', {
    failureRedirect: PROVIDERS_FAILURE_REDIRECT,
    session: false
  }),
  async function (req: Request, res: Response) {
    // Successful authentication, redirect home.
    // generate tokens and redirect back home

    const { user } = req

    console.log({ user })

    res.send('in callback')
  }
)

export default router
