import { GraphQLClient } from 'graphql-request'
import { print } from 'graphql/language/printer'
import { Variables } from 'graphql-request/dist/src/types'
import { ASTNode } from 'graphql'

const { HASURA_GRAPHQL_ENDPOINT, HASURA_GRAPHQL_ADMIN_SECRET } = process.env

/**
 * To take advantage of syntax highlighting and auto-formatting
 * for GraphQL template literal tags (`gql`) in `src/utils/queries.ts`,
 * you need to `print()` queries before passing them to `graphql-request`.

 * https://github.com/prisma-labs/graphql-request/issues/10
 */
export function request(query: ASTNode, variables?: Variables) {
  const request = new GraphQLClient(<string>HASURA_GRAPHQL_ENDPOINT, {
    headers: { 'x-hasura-admin-secret': <string>HASURA_GRAPHQL_ADMIN_SECRET }
  })

  return request.request(print(query), variables)
}
