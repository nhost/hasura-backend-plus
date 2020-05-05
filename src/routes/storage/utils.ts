import { getClaims } from '@shared/jwt'
import safeEval, { FunctionFactory } from 'notevil'
import { v4 as uuidv4 } from 'uuid'

import Boom from '@hapi/boom'
import { HeadObjectOutput } from 'aws-sdk/clients/s3'
import { Request } from 'express'
import { S3_BUCKET } from '@shared/config'
import fs from 'fs'
import path from 'path'
import { s3 } from '@shared/s3'
import yaml from 'js-yaml'
import { Claims } from '@shared/types'

export const META_PREFIX = '/meta'
export interface StoragePermissions {
  read: string
  write: string
  get: string
  list: string
  create: string
  update: string
  delete: string
}

interface StorageRules {
  functions?: { [key: string]: string | { params: string[]; code: string } }
  paths: {
    [key: string]: Partial<StoragePermissions> & {
      meta: Partial<StoragePermissions> & { values?: { [key: string]: string } }
    }
  }
}

interface StorageRequest {
  path: string
  query: unknown
  method: string
  params?: string
  auth?: Claims
}

export const containsSomeRule = (
  rulesDefinition: Partial<StoragePermissions> = {},
  rules: (string | undefined)[]
): boolean => Object.keys(rulesDefinition).some((rule) => rules.includes(rule))

type StorageContext = { [key: string]: unknown } & {
  request: StorageRequest
  resource: object
}

let storageRules: StorageRules = { paths: {} }
try {
  const fileContents = fs.readFileSync(
    path.resolve(process.env.PWD || '.', 'custom/storage-rules/rules.yaml'),
    'utf8'
  )
  try {
    storageRules = yaml.safeLoad(fileContents) as StorageRules
  } catch (e) {
    throw Boom.badImplementation('Custom storage security rules: invalid YAML file.')
  }
} catch (e) {
  console.warn('No custom storage security rules found.')
}

export const STORAGE_RULES = storageRules

// TODO allow functions to use other functions
const storageFunctions = (context: object): { [key: string]: Function } =>
  Object.entries(storageRules.functions || {}).reduce<{
    [key: string]: Function
  }>((aggr, [name, value]) => {
    if (typeof value === 'string') {
      aggr[name] = FunctionFactory(context)('"use strict"; ' + value)
    } else {
      aggr[name] = FunctionFactory(context)(...value.params, '"use strict"; ' + value.code)
    }
    return aggr
  }, {})

export const createContext = (
  req: Request,
  s3HeadObject: object = {} // TODO better s3 head object type
): object => {
  let auth
  try {
    auth = getClaims(req.headers.authorization)
  } catch {
    auth = undefined
  }
  const variables: StorageContext = {
    request: {
      path: req.path,
      method: req.method,
      query: req.query,
      auth
    },
    ...req.params,
    resource: s3HeadObject
  }
  const functions = storageFunctions(variables)
  return { ...functions, ...variables }
}

export const hasPermission = (rules: (string | undefined)[], context: object): boolean =>
  rules.some((rule) => rule && !!safeEval(rule, context))

export const generateMetadata = (metadataParams: object, context: object): object =>
  Object.entries(metadataParams).reduce<{ [key: string]: unknown }>((aggr, [key, jsCode]) => {
    try {
      const value = safeEval(jsCode as string, context)
      if (value) {
        aggr[key] = value
      }
    } catch (err) {
      throw Boom.badImplementation(`Invalid formula for metadata key ${key}: '${jsCode}'`)
    }
    return aggr
  }, {})

// Creates an object key that is the path without the first character '/'
export const getKey = (req: Request): string => req.path.substring(1)

export const getHeadObject = async (
  req: Request,
  ignoreErrors = false
): Promise<HeadObjectOutput | undefined> => {
  const params = {
    Bucket: S3_BUCKET as string,
    Key: getKey(req)
  }
  try {
    return await s3.headObject(params).promise()
  } catch (err) {
    if (ignoreErrors) {
      return
    }
    throw Boom.notFound()
  }
}

export const replaceMetadata = async (
  req: Request,
  keepOldMetadata: boolean,
  newMetadata: object = {}
): Promise<void> => {
  const key = getKey(req)
  const oldHeadObject = await getHeadObject(req, true)

  // As S3 objects are immutable, we need to replace the entire object by its copy
  const params = {
    Bucket: S3_BUCKET as string,
    Key: key,
    CopySource: `${S3_BUCKET}/${key}`,
    ContentType: oldHeadObject?.ContentType,
    Metadata: {
      ...((keepOldMetadata && oldHeadObject?.Metadata) || {
        token: uuidv4()
      }),
      ...newMetadata
    },
    MetadataDirective: 'REPLACE'
  }
  try {
    await s3.copyObject(params).promise()
  } catch (err) {
    throw Boom.badImplementation('Impossible to update the object metadata.')
  }
}
