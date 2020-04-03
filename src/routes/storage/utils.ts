import yaml from 'js-yaml'
import fs from 'fs'
import safeEval, { FunctionFactory } from 'notevil'
import { verify, Claims } from '@shared/jwt'
import { Request } from 'express'
import path from 'path'
import Boom from '@hapi/boom'
import { S3_BUCKET } from '@shared/config'
import { s3 } from '@shared/s3'
import { HeadObjectOutput } from 'aws-sdk/clients/s3'

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
      'meta-path': Partial<StoragePermissions>
    } & {
      metadata?: { [key: string]: string }
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

// interface StorageResource {
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   metadata: { [key: string]: any } // TODO more details
// }

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
    console.log('Custom storage security rules: invalid YAML file.')
    console.log(e)
  }
} catch (e) {
  console.log('No custom storage security rules found.')
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
  resource: object = {} // TODO better resource type
): object => {
  const variables: StorageContext = {
    request: {
      path: req.path,
      method: req.method,
      query: req.query,
      auth: verify(req.headers.authorization, true)?.['https://hasura.io/jwt/claims']
    },
    ...req.params,
    resource
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

export const getResource = async (req: Request): Promise<HeadObjectOutput> => {
  const params = {
    Bucket: S3_BUCKET as string,
    Key: getKey(req)
  }
  try {
    return await s3.headObject(params).promise()
  } catch (err) {
    throw Boom.notFound()
  }
}

// * See: https://firebase.google.com/docs/reference/security/storage
// TODO add timestamps and duration
// TODO math?
// TODO string matches
// TODO isUuid?
// TODO add param to yaml to define a custom key?
// ? remove?
// export const validate = (request: StorageRequest, resource: StorageResource): boolean => {
//   const currentPath = request.path
//   const requestContext = {
//     request,
//     resource,
//     ...storageFunctions
//   }
//   const invalidList = Object.entries(storageRules.paths).filter(([rulePath, ruleMethodChecks]) => {
//     const regexpKeys: Key[] | undefined = []
//     const regexp = pathToRegexp(rulePath, regexpKeys)
//     const regexpResult = regexp.exec(currentPath)
//     // Checks if the current request path matches with the rule path
//     if (regexpResult) {
//       // Checks if a rule for the method exists
//       if (ruleMethodChecks[request.method]) {
//         // TODO 'read' and 'write' cases
//         const routeParams = regexpKeys.reduce(
//           (aggr, key, index) => ({ ...aggr, [key.name]: regexpResult[index + 1] }),
//           {}
//         )
//         // If the evaluated rule is true, we remove the rule path from the invalid list. If not, we keep it
//         return !safeEval(ruleMethodChecks[request.method] as string, {
//           ...requestContext,
//           ...routeParams
//         })
//       } else {
//         // No rule definition have been found of the method. As a consequence the rule path is kept in the invalid list
//         return true
//       }
//     } else {
//       // The path defined in the storage rules does not match with the requested path: the path is removed from the invalid list
//       return false
//     }
//   })
//   console.log(invalidList)
//   return invalidList.length === 0
// }
