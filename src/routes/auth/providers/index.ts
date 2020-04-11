import { Router } from 'express'

import initGitHub from './github'
import { AUTH_GITHUB_ENABLE } from '@shared/config'

const initRoutes = (): Router | undefined => {
  if (AUTH_GITHUB_ENABLE) {
    const router = Router()
    router.use('/github', initGitHub())
    return router
  } else {
    console.log('No OAuth provider is configured')
  }
}

export default initRoutes()
