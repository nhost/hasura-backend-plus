import { META_PREFIX, STORAGE_RULES, StoragePermissions, containsSomeRule } from './utils'
import { NextFunction, Request, Response, Router } from 'express'

import { deleteFile } from './delete'
import { getFile } from './get'
import { listFile } from './list'
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
  if (containsSomeRule(rules, ['write', 'create', 'update'])) {
    middleware.post(
      path,
      createSecureMiddleware(uploadFile, rules, isMetadataRequest, metadataParams)
    )
  }
  if (containsSomeRule(rules, ['read', 'get'])) {
    middleware.get(path, createSecureMiddleware(getFile, rules, isMetadataRequest))
  }
  if (containsSomeRule(rules, ['read', 'list'])) {
    middleware.get(
      `${path.substring(0, path.lastIndexOf('/'))}`,
      createSecureMiddleware(listFile, rules, isMetadataRequest)
    )
  }
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

  router.use(createRoutes(path, rules, false, rules.meta?.values))
  if (
    containsSomeRule(rules.meta, ['read', 'write', 'get', 'create', 'update', 'delete', 'list'])
  ) {
    router.use(META_PREFIX, createRoutes(path, rules.meta, true, rules.meta?.values))
  }
}

export default router
