import { Router, Request, Response } from 'express'
import { Strategy } from 'passport-magic-link'
import Boom from '@hapi/boom'
import { PROVIDERS, SMTP_ENABLE, PROVIDER_SUCCESS_REDIRECT, SERVER_URL } from '@shared/config'
import { initProvider } from './utils'
import { selectAccount, AccountData } from '@shared/helpers'
import { emailClient } from '@shared/email'

export default (router: Router): void => {
  const options = PROVIDERS.magiclink

  // Checks if the strategy is enabled. Don't create any route otherwise
  if (options) {
    if (
      (SMTP_ENABLE && !options.secret) ||
      !options.userFields ||
      !options.tokenField ||
      !options.ttl
    ) {
      throw Boom.badImplementation(`Missing environment variables for Magic links.`)
    }

    initProvider(router, 'magiclink', Strategy, {
      passReqToCallbacks: true,
      // Verify if the account is valid after the token link is clicking instead
      // of verifying before the magic link is generated
      verifyUserAfterToken: true,
      // The default action for magic links for the authenticate url should
      // be the action named 'requestToken'
      providerAuthenticateConfig: {
        action: 'requestToken'
      },

      // A Method which can decide what should happen after the successful authentication strategy step
      // some Passport.js strategies want to change the default providerCallback logic.
      circuitBreakerMiddleware: (req: Request, res: Response) => {
        const redirectURL = options.tokenRequestedUrl || PROVIDER_SUCCESS_REDIRECT
        return res.redirect(redirectURL as string)
      },

      // For the callback url we need to override the options so we can change
      // the action-property to the mode 'acceptToken'
      providerCallbackConfig: {
        action: 'acceptToken',
        // Ensure that we lookup users by the id instead of email
        userPrimaryKey: 'id',
        allowReuse: false
      },

      // Override the settings
      ttl: parseInt(options.ttl as string, 10),

      callbackMethods: ['GET', 'POST'],

      // This authentication provider needs extra functions passed before the normal user method
      // so here we define the functions in the right order to combine  in the final Strategy
      // constructor parameter list
      providerMiddlewares: [
        // Method which gets triggered by the auth provider when the token needs to be mailed
        async (_request: Request, user: { email: string }, token: string): Promise<void> => {
          try {
            // Silently ignore the issue that we couldn't lookup the email address
            const accountData = await selectAccount({ email: user.email })
            if (accountData) {
              // send email with the magic link
              console.log('token: ', token)
              try {
                await emailClient.send({
                  template: 'magic-link',
                  locals: { ticket: token, url: SERVER_URL, domain: 'DOMAIN_ENV_VAR' },
                  message: {
                    to: user.email,
                    headers: {
                      'x-ticket': {
                        prepared: true,
                        value: token
                      }
                    }
                  }
                })
              } catch (err) {
                console.error('Unable to send email')
                throw Boom.badImplementation()
              }
            }
          } catch (err) {
            console.error('Something went wrong while looking up account', err)
            return
          }
        },
        // Method which gets triggered by the auth provider to verify user details are valid
        async (_request: Request, user: { email: string }): Promise<AccountData> => {
          console.log('verifyUser() user: ', user)

          // The user data which was stored in the Magic link ticket which we wil use to lookup the account information associated
          try {
            const accountData = await selectAccount({ email: user.email })
            if (!accountData) {
              // Failed to find the associated account for the email address
              throw Boom.badImplementation()
            }

            // Return the account data
            return accountData
          } catch (err) {
            throw Boom.badImplementation()
          }
        }
      ]
    })
  }
}
