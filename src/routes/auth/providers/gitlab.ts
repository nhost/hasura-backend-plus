import { Router } from 'express'
import { Strategy } from 'passport-gitlab2'
import { PROVIDERS } from '@shared/config'
import { initProvider } from './utils'

export default (router: Router): void => {
  const options = PROVIDERS.gitlab

  initProvider(router, 'gitlab', Strategy, {
    scope: PROVIDERS.gitlab?.scope.join(' '),
    ...(options?.baseUrl && { baseURL: options.baseUrl })
  }, (req, res, next) => {
    if(!PROVIDERS.gitlab) {
      return res.boom.badImplementation(`Please set the GITLAB_ENABLED env variable to true to use the auth/providers/gitlab routes.`)
    } else if (!options?.clientID || !options?.clientSecret) {
      return res.boom.badImplementation(`Missing environment variables for Gitlab OAuth.`)
    } else {
      return next();
    }
  })
}
