import { OBJECT_PREFIX, META_PREFIX, STORAGE_RULES, PathConfig, containsSomeRule } from './utils'
import { NextFunction, Request, Response, Router } from 'express'

import { deleteFile } from './delete'
import { listFile } from './list'
import { getFile } from './get'
import { uploadFile } from './upload'

const router = Router()

const createSecureMiddleware = (
  fn: Function,
  rules: Partial<PathConfig>,
  isMetadataRequest: boolean
) => (req: Request, res: Response, next: NextFunction): void =>
  fn(req, res, next, rules, isMetadataRequest, rules.metadata).catch(next)

const createRoutes = (
  path: string,
  rules: Partial<PathConfig>,
  isMetadataRequest = false
): Router => {
  const middleware = Router()

  // write, create, update
  if (containsSomeRule(rules, ['write', 'create', 'update'])) {
    middleware.post(path, createSecureMiddleware(uploadFile, rules, isMetadataRequest))
  }

  // read, get, list
  if (containsSomeRule(rules, ['read', 'get', 'list'])) {
    if (path.endsWith('/')) {
      middleware.get(path, createSecureMiddleware(listFile, rules, isMetadataRequest))
    } else {
      middleware.get(path, createSecureMiddleware(getFile, rules, isMetadataRequest))
      middleware.get(
        path.substring(0, path.lastIndexOf('/')),
        createSecureMiddleware(listFile, rules, isMetadataRequest)
      )
    }
  }

  // write, delete
  if (containsSomeRule(rules, ['write', 'delete'])) {
    middleware.delete(path, createSecureMiddleware(deleteFile, rules, isMetadataRequest))
  }

  return middleware
}

for (const path in STORAGE_RULES.paths) {
  const rules = STORAGE_RULES.paths[path]

  // create object data paths
  router.use(OBJECT_PREFIX, createRoutes(path, rules, false))

  // create meta data paths
  router.use(META_PREFIX, createRoutes(path, rules, true))
}

export default router
