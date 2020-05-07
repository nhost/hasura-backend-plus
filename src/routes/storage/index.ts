import {
  OBJECT_PREFIX,
  META_PREFIX,
  STORAGE_RULES,
  StoragePermissions,
  containsSomeRule
} from './utils'
import { NextFunction, Request, Response, Router } from 'express'

import { deleteFile } from './delete'
import { listGet } from './list_get'
import { uploadFile } from './upload'

const router = Router()

const createSecureMiddleware = (
  fn: Function,
  rules: Partial<StoragePermissions>,
  isMetadataRequest: boolean,
  metadataParams: object = {}
) => (req: Request, res: Response, next: NextFunction): void =>
  fn(req, res, next, rules, isMetadataRequest, metadataParams).catch(next)

const createRoutes = (
  path: string,
  rules: Partial<StoragePermissions>,
  isMetadataRequest = false,
  metadataParams: object = {}
): Router => {
  const middleware = Router()

  // write, create, update
  if (containsSomeRule(rules, ['write', 'create', 'update'])) {
    middleware.post(
      path,
      createSecureMiddleware(uploadFile, rules, isMetadataRequest, metadataParams)
    )
  }

  // read, get, list
  if (containsSomeRule(rules, ['read', 'get', 'list'])) {
    middleware.get(path, createSecureMiddleware(listGet, rules, isMetadataRequest))
  }

  // write, delete
  if (containsSomeRule(rules, ['write', 'delete'])) {
    middleware.delete(
      path,
      createSecureMiddleware(deleteFile, rules, isMetadataRequest, metadataParams)
    )
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
