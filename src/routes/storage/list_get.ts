import { NextFunction, Request, Response } from 'express'
import { PathConfig, getKey } from './utils'
import { getFile } from './get'
import { listFile } from './list'

export const listGet = async (
  req: Request,
  res: Response,
  _next: NextFunction,
  rules: Partial<PathConfig>,
  isMetadataRequest = false
): Promise<unknown> => {
  const key = getKey(req)

  // get dir
  if (key.endsWith('/')) {
    return listFile(req, res, _next, rules, isMetadataRequest)
  }

  // or get file
  return getFile(req, res, _next, rules, isMetadataRequest)
}
