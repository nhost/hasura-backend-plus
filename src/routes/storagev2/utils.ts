import yaml from 'js-yaml'
import fs from 'fs'
import safeEval, { FunctionFactory } from 'notevil'
import { verify } from '@shared/jwt'
import { Request } from 'express'
import path from 'path'

type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]

interface StoragePermissions {
  read: string
  write: string
  get: string
  list: string
  create: string
  update: string
  delete: string
}
type StorageMethod = 'read' | 'write' | 'get' | 'list' | 'create' | 'update' | 'delete'
interface StorageRules {
  functions?: { [key: string]: string | { params: string[]; code: string } }
  paths: {
    [key: string]: RequireAtLeastOne<StoragePermissions, StorageMethod>
  }
}

// interface StorageRequest {
//   path: string
//   method: StorageMethod
//   params?: string
//   auth?: Claims
// }

// interface StorageResource {
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   metadata: { [key: string]: any } // TODO more details
// }

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
  const variables = {
    request: {
      path: req.path,
      auth: verify(req.headers.authorization)['https://hasura.io/jwt/claims']
    },
    ...req.params,
    resource
  }
  const functions = storageFunctions(variables)
  return { ...functions, ...variables }
}

export const hasPermission = (rules: (string | undefined)[], context: object): boolean => {
  return rules.some((rule) => rule && !!safeEval(rule, context))
}

// Creates an object key that is the path without the first character '/'
export const getKey = (req: Request): string => req.path.substring(1)

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
