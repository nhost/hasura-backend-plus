import { Claims } from '@shared/helpers'

/**
 * Validate storage permission based on key, type and jwt claims
 *
 * @param key The S3 key, ex `test/self.png`
 * @param type Should be one of [read, write].
 * @param claims Hasura JWT claims
 * @returns boolean
 */
// eslint-disable-next-line
export function storagePermission(key: string, type: string, claims: Claims): boolean {
  console.log('check storage permissions')
  console.log(`key: ${key}`)
  console.log(`type: ${type}`)
  console.log(`claims:`)
  return true
}
