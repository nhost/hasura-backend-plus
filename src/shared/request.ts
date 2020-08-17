import { HASURA_ENDPOINT, HASURA_GRAPHQL_ADMIN_SECRET } from './config'

import Boom from '@hapi/boom'
import { ASTNode } from 'graphql'
import { GraphQLClient } from 'graphql-request'
import { Variables } from 'graphql-request/dist/src/types'
import { print } from 'graphql/language/printer'
/**
 * To take advantage of syntax highlighting and auto-formatting
 * for GraphQL template literal tags (`gql`) in `src/utils/queries.ts`,
 * you need to `print()` queries before passing them to `graphql-request`.

 * https://github.com/prisma-labs/graphql-request/issues/10
 */
export async function request<T extends unknown>(
  query: ASTNode,
  variables?: Variables
): Promise<T> {
  const client = new GraphQLClient(HASURA_ENDPOINT, {
    headers: HASURA_GRAPHQL_ADMIN_SECRET
      ? { 'x-hasura-admin-secret': HASURA_GRAPHQL_ADMIN_SECRET }
      : undefined
  })

  try {
    return (await client.request(print(query), variables)) as T
  } catch (err) {
    console.error(err)
    throw Boom.badImplementation()
  }
}
