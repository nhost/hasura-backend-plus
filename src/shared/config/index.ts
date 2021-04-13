// ! Keep dotent.config at the very beginning of the file!!!
import dotenv from 'dotenv'
// Load '.env' file if production mode, '.env.<NODE_ENV>' otherwise
const envFile =
  process.env.NODE_ENV && process.env.NODE_ENV !== 'production'
    ? `.env.${process.env.NODE_ENV}`
    : '.env'
dotenv.config({ path: envFile })

import { APPLICATION } from './application'
export * from './application'
export * from './authentication'
export * from './storage'
export * from './headers';

/**
 * * Check required settings, and raise an error if some are missing.
 */
if (!APPLICATION.HASURA_ENDPOINT) {
  throw new Error('No Hasura GraphQL endpoint found.')
}
