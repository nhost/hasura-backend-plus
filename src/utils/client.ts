import { GraphQLClient } from 'graphql-request'

const endpoint = process.env.HASURA_GRAPHQL_ENDPOINT as string
const secret = process.env.HASURA_GRAPHQL_ADMIN_SECRET as string

export const client = new GraphQLClient(endpoint, {
  headers: { 'x-hasura-admin-secret': secret }
})
