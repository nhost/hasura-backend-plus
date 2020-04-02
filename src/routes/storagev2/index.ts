import { Router, NextFunction, Request, Response } from 'express'

import { STORAGE_RULES } from './utils'
import { uploadFile } from './upload'
import { getFile } from './get'
import { deleteFile } from './delete'
const router = Router()

const createSecureMiddleware = (fn: Function, rules: (string | undefined)[]) => (
  req: Request,
  res: Response,
  next: NextFunction
): void => fn(req, res, next, rules).catch(next)

for (const path in STORAGE_RULES.paths) {
  const rule = STORAGE_RULES.paths[path]
  if (rule.create || rule.update || rule.write) {
    router.post(path, createSecureMiddleware(uploadFile, [rule.create, rule.update, rule.write]))
  }
  if (rule.get || rule.read) {
    router.get(path, createSecureMiddleware(getFile, [rule.get, rule.read]))
  }
  // TODO list
  // if (rule.list || rule.read) {
  //   router.get(`${path}/`, () => {
  //     console.log('TODO')
  //   })
  // }
  if (rule.delete || rule.write) {
    router.delete(path, createSecureMiddleware(deleteFile, [rule.delete, rule.write]))
  }
  // TODO metadata
}

export default router
