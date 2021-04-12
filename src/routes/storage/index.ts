import {
  OBJECT_PREFIX,
  META_PREFIX,
  STORAGE_RULES,
  PathConfig,
  containsSomeRule,
  PRESIGN_PREFIX
} from './utils'
import { NextFunction, Response, Router } from 'express'
import { deleteFile } from './delete'
import { listGet } from './list_get'
import { uploadFile } from './upload'
import { getFilePresignedURL } from './get_presigned'
import { uploadFilePresignedURL } from './upload_presigned'
import { RequestExtended } from '@shared/types'

const router = Router()

const createSecureMiddleware = (
  fn: Function,
  rules: Partial<PathConfig>,
  isMetadataRequest: boolean
) => (req: RequestExtended, res: Response, next: NextFunction): void =>
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
    middleware.get(
      path,
      (_, res, next) => {
        res.removeHeader('X-Frame-Options')
        next()
      },
      createSecureMiddleware(listGet, rules, isMetadataRequest)
    )
  }

  // write, delete
  if (containsSomeRule(rules, ['write', 'delete'])) {
    middleware.delete(path, createSecureMiddleware(deleteFile, rules, isMetadataRequest))
  }

  return middleware
}

const createPresignedRoutes = (path: string, rules: Partial<PathConfig>): Router => {
  const middleware = Router()

  // Presigned requests will never be metadata requests
  const isMetadataRequest = false

  // write, create, update
  if (containsSomeRule(rules, ['write', 'create', 'update'])) {
    middleware.post(path, createSecureMiddleware(uploadFilePresignedURL, rules, isMetadataRequest))
  }

  // read, get
  if (containsSomeRule(rules, ['read', 'get', 'list'])) {
    middleware.get(
      path,
      (_, res, next) => {
        res.removeHeader('X-Frame-Options')
        next()
      },
      createSecureMiddleware(getFilePresignedURL, rules, isMetadataRequest)
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

  // create object presign paths
  router.use(PRESIGN_PREFIX, createPresignedRoutes(path, rules))
}

export default router
