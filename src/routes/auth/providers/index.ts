import { AUTH_GITHUB_ENABLE } from '@shared/config'
import { Router } from 'express'
import initGitHub from './github'

const initRoutes = (): Router | undefined => {
  if (AUTH_GITHUB_ENABLE) {
    const router = Router()
    router.use('/github', initGitHub())
    return router
  }
}

export default initRoutes()
