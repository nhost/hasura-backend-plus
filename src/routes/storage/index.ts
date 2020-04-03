import { Router, NextFunction, Request, Response } from 'express'

import { STORAGE_RULES, StoragePermissions, META_PREFIX } from './utils'
import { uploadFile } from './upload'
import { getFile } from './get'
import { deleteFile } from './delete'
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
  middleware.post(
    path,
    createSecureMiddleware(uploadFile, rules, isMetadataRequest, metadataParams)
  )
  middleware.get(path, createSecureMiddleware(getFile, rules, isMetadataRequest))
  // TODO list
  //   router.get(`${path}/`, createSecureMiddleware(listFiles, rules, isMetadataRequest))
  middleware.delete(
    path,
    createSecureMiddleware(deleteFile, rules, isMetadataRequest, metadataParams)
  )

  return middleware
}

for (const path in STORAGE_RULES.paths) {
  const rules = STORAGE_RULES.paths[path]
  router.use(createRoutes(path, rules, false, rules.metadata))
  if (rules['meta-path']) {
    router.use(META_PREFIX, createRoutes(path, rules['meta-path'], true))
  }
}

export default router
