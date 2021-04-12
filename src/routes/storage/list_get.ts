import { NextFunction, Response } from 'express'
import { PathConfig, getKey } from './utils'
import { getFile } from './get'
import { getFilePresignedURL } from './get_presigned'
import { listFile } from './list'
import { RequestExtended } from '@shared/types'

export const listGet = async (
  req: RequestExtended,
  res: Response,
  _next: NextFunction,
  rules: Partial<PathConfig>,
  isMetadataRequest = false,
  isPresignedRequest = false
): Promise<unknown> => {
  const key = getKey(req)

  // get dir
  if (key.endsWith('/')) {
    return listFile(req, res, _next, rules, isMetadataRequest)
  }

  // or get file
  if (isPresignedRequest) {
    return getFilePresignedURL(req, res, _next, rules)
  }

  return getFile(req, res, _next, rules, isMetadataRequest)
}
