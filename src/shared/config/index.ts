import Boom from '@hapi/boom'
import dotenv from 'dotenv'
import { HASURA_ENDPOINT } from './application'

// Load '.env' file if production mode, '.env.<NODE_ENV>' otherwise
const envFile =
  process.env.NODE_ENV && process.env.NODE_ENV !== 'production'
    ? `.env.${process.env.NODE_ENV}`
    : '.env'
dotenv.config({ path: envFile })

export * from './application'
export * from './authentication'
export * from './storage'

/**
 * * Check required settings, and raise an error if some are missing.
 */
if (!HASURA_ENDPOINT) {
  throw Boom.badImplementation('No Hasura GraphQL endpoint found.')
}
