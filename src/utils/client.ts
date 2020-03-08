import { GraphQLClient } from 'graphql-request'
import { print } from 'graphql/language/printer'
import { Variables } from 'graphql-request/dist/src/types'
import { ASTNode } from 'graphql'

const { HASURA_GRAPHQL_ENDPOINT, HASURA_GRAPHQL_ADMIN_SECRET } = process.env

export const client = (query: ASTNode, variables?: Variables) => {
  const client = new GraphQLClient(<string>HASURA_GRAPHQL_ENDPOINT, {
    headers: { 'x-hasura-admin-secret': <string>HASURA_GRAPHQL_ADMIN_SECRET }
  })

  return client.request(print(query), variables)
}
