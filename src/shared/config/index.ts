import Boom from '@hapi/boom'
import { HASURA_ENDPOINT } from './application'

export * from './application'
export * from './authentication'
export * from './storage'

/**
 * * Check required settings, and raise an error if some are missing.
 */
if (!HASURA_ENDPOINT) {
  throw Boom.badImplementation('No Hasura GraphQL endpoint found.')
}
