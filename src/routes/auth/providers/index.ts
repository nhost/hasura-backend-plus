import { Router } from 'express'

import github from './github'
import google from './google'

import { AUTH_PROVIDERS_ENABLE } from '@shared/config'

const initRoutes = (): Router | undefined => {
  if (AUTH_PROVIDERS_ENABLE) {
    // Create the middleware only if at least one provider is enabled
    const router = Router()
    github(router)
    google(router)
    return router
  }
}

export default initRoutes()
