import { Claims } from '@shared/jwt'

/**
 * Validate storage permission based on key, type and jwt claims
 *
 * @param key The S3 key, ex `test/self.png`
 * @param type Should be one of [read, write].
 * @param claims Hasura JWT claims
 * @returns boolean
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function storagePermission(key: string, type: string, claims: Claims): boolean {
  console.log('Check Storage Permissions')

  console.log(`Key: ${key}`)
  console.log(`Type: ${type}`)
  console.log(`Claims:`)

  return true
}
