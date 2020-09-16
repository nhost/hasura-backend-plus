import { AUTH_HAS_ONE_PROVIDER } from '@shared/config'
import { Router } from 'express'

import github from './github'
import google from './google'
import facebook from './facebook'
import twitter from './twitter'
import apple from './apple'
import windowslive from './windowslive'
import linkedin from './linkedin'

const initRoutes = (): Router | undefined => {
  if (AUTH_HAS_ONE_PROVIDER) {
    // Create the middleware only if at least one provider is enabled
    const router = Router()
    github(router)
    google(router)
    facebook(router)
    twitter(router)
    apple(router)
    windowslive(router)
    linkedin(router)
    return router
  }
}

export default initRoutes()
