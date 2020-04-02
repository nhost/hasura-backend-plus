import { Router, NextFunction, Request, Response } from 'express'

import { STORAGE_RULES } from './utils'
import { upsertFile } from './upsert'
import { getFile } from './get'
const router = Router()

const createSecureMiddleware = (fn: Function, rules: (string | undefined)[]) => (
  req: Request,
  res: Response,
  next: NextFunction
): void => fn(req, res, next, rules).catch(next)

for (const path in STORAGE_RULES.paths) {
  const rule = STORAGE_RULES.paths[path]
  if (rule.create || rule.update || rule.write) {
    router.post(path, createSecureMiddleware(upsertFile, [rule.create, rule.update, rule.write]))
  }
  if (rule.get || rule.read) {
    router.get(path, createSecureMiddleware(getFile, [rule.get, rule.read]))
  }
  if (rule.list || rule.read) {
    router.get(`${path}/`, () => {
      console.log('TODO')
    })
  }
  if (rule.delete || rule.write) {
    router.delete(path, () => {
      console.log('TODO')
    })
  }
}

// TODO metadata
export default router
