import { Router, NextFunction, Request, Response } from 'express'

import { STORAGE_RULES, StoragePermissions, META_PREFIX } from './utils'
import { uploadFile } from './upload'
import { getFile } from './get'
import { deleteFile } from './delete'
const router = Router()

const createSecureMiddleware = (
  fn: Function,
  rules: (string | undefined)[],
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
  if (rules.create || rules.update || rules.write) {
    middleware.post(
      path,
      createSecureMiddleware(
        uploadFile,
        [rules.create, rules.update, rules.write],
        isMetadataRequest,
        metadataParams
      )
    )
  }
  if (rules.get || rules.read) {
    middleware.get(
      path,
      createSecureMiddleware(getFile, [rules.get, rules.read], isMetadataRequest)
    )
  }
  // TODO list
  // if (rules.list || rules.read) {
  //   router.get(`${path}/`, () => {
  //     console.log('TODO')
  //   })
  // }
  if (rules.delete || rules.write) {
    middleware.delete(
      path,
      createSecureMiddleware(
        deleteFile,
        [rules.delete, rules.write],
        isMetadataRequest,
        metadataParams
      )
    )
  }
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
