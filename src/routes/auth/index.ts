import { Router } from 'express'
import nocache from 'nocache'
import changeEmail from './change-email'
import getJwks from './jwks'
import loginAccount from './login'
import logout from './logout'
import mfa from './mfa'
import changePassword from './change-password'
import providers from './providers'
import registerAccount from './register'
import token from './token'
import activateAccount from './activate'
import deleteAccount from './delete'
import magicLink from './magic-link'
import { AUTHENTICATION } from '@shared/config'
import whitelist from './whitelist'
import resendConfirmation from './resend-confirmation'
import deanonymize from './deanonymize'
import changeLocale from './change-locale'

const router = Router()

router.use(nocache())

router.use((req, res, next) => {
  if (!AUTHENTICATION.ENABLED) {
    return res.boom.badImplementation(`Please set the AUTH_ENABLED env variable to true to use the auth routes.`)
  } else {
    return next();
  }
})

providers(router)
mfa(router)
changeEmail(router)
activateAccount(router)
deleteAccount(router)
loginAccount(router)
logout(router)
registerAccount(router)
changePassword(router)
getJwks(router)
token(router)
magicLink(router)
whitelist(router)
resendConfirmation(router)
deanonymize(router)
changeLocale(router)

export default (parentRouter: Router) => {
  parentRouter.use('/auth', router)
}