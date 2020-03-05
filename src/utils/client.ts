import { GraphQLClient } from 'graphql-request'

/**
 * API_ENDPOINT is the GraphQL Endpoint to your Hasura instance
 * ADMIN_SECRET is the "x-hasura-admin-secret" shown in your console
 */
const { API_ENDPOINT, ADMIN_SECRET }: any = process.env

export default new GraphQLClient(API_ENDPOINT, {
  headers: {
    'x-hasura-admin-secret': ADMIN_SECRET
  }
})
