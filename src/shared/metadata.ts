import { APPLICATION } from './config'
import axios from 'axios'

interface Table {
  name: string
  schema: string
  foreignKey?: string
}

interface Relationship {
  name: string
  source: Table
  destination?: Table
  isArray?: Boolean
}

function trackTable(table: Table) {
  return axios.post(
    APPLICATION.HASURA_ENDPOINT.replace('/v1/graphql', '/v1/query'),
    {
      type: 'track_table',
      args: {
        table: {
          name: table.name,
          schema: table.schema
        }
      }
    },
    {
      headers: {
        'x-hasura-admin-secret': APPLICATION.HASURA_GRAPHQL_ADMIN_SECRET
      }
    }
  )
}

function trackRelationship(relationship: Relationship) {
  const sourceTable = relationship.source
  const destinationTable = relationship.destination

  const using = destinationTable
    ? relationship.isArray
      ? {
          foreign_key_constraint_on: {
            table: { name: destinationTable.name, schema: destinationTable.schema },
            column: destinationTable.foreignKey
          }
        }
      : {
          manual_configuration: {
            column_mapping: { id: destinationTable.foreignKey },
            remote_table: {
              name: destinationTable.name,
              schema: destinationTable.schema
            }
          }
        }
    : { foreign_key_constraint_on: sourceTable.foreignKey }

  return axios.post(
    APPLICATION.HASURA_ENDPOINT.replace('/v1/graphql', '/v1/query'),
    {
      type: relationship.isArray? 'create_array_relationship' : 'create_object_relationship',
      args: {
        table: {
          name: sourceTable.name,
          schema: sourceTable.schema
        },
        name: relationship.name,
        using: using
      }
    },
    {
      headers: {
        'x-hasura-admin-secret': APPLICATION.HASURA_GRAPHQL_ADMIN_SECRET
      }
    }
  )
}

export async function applyMetadata(): Promise<void> {
  console.log('Applying metadata')

  await Promise.allSettled([
    trackTable({ name: 'account_providers', schema: 'auth' }),
    trackTable({ name: 'account_roles', schema: 'auth' }),
    trackTable({ name: 'accounts', schema: 'auth' }),
    trackTable({ name: 'providers', schema: 'auth' }),
    trackTable({ name: 'refresh_tokens', schema: 'auth' }),
    trackTable({ name: 'roles', schema: 'auth' }),
    trackTable({ name: 'users', schema: 'public' })
  ]).then(function (results) {
    console.log('RESULTS: ', results)
  })

  await Promise.allSettled([
    trackRelationship({
      source: { name: 'account_providers', schema: 'auth', foreignKey: 'account_id' },
      name: 'account'
    }),
    trackRelationship({
      source: { name: 'account_providers', schema: 'auth', foreignKey: 'auth_provider' },
      name: 'provider'
    }),
    trackRelationship({
      source: { name: 'account_roles', schema: 'auth', foreignKey: 'account_id' },
      name: 'account'
    }),
    trackRelationship({
      source: { name: 'account_roles', schema: 'auth', foreignKey: 'role' },
      name: 'roleByRole'
    }),
    trackRelationship({
      source: { name: 'accounts', schema: 'auth', foreignKey: 'default_role' },
      name: 'role'
    }),
    trackRelationship({
      source: { name: 'accounts', schema: 'auth', foreignKey: 'user_id' },
      name: 'user'
    }),
    trackRelationship({
      source: { name: 'refresh_tokens', schema: 'auth', foreignKey: 'account_id' },
      name: 'account'
    }),
    trackRelationship({
      source: { name: 'users', schema: 'public' },
      destination: { name: 'accounts', schema: 'auth', foreignKey: 'user_id' },
      name: 'account'
    })
  ]).then(function (results) {})

  await Promise.allSettled([
    trackRelationship({
      source: { name: 'accounts', schema: 'auth' },
      destination: { name: 'account_providers', schema: 'auth', foreignKey: 'account_id' },
      name: 'account_providers',
      isArray: true
    }),
    trackRelationship({
      source: { name: 'accounts', schema: 'auth' },
      destination: { name: 'account_roles', schema: 'auth', foreignKey: 'account_id' },
      name: 'account_roles',
      isArray: true
    }),
    trackRelationship({
      source: { name: 'accounts', schema: 'auth' },
      destination: { name: 'refresh_tokens', schema: 'auth', foreignKey: 'account_id' },
      name: 'refresh_tokens',
      isArray: true
    }),
    trackRelationship({
      source: { name: 'providers', schema: 'auth' },
      destination: { name: 'account_providers', schema: 'auth', foreignKey: 'auth_provider' },
      name: 'account_providers',
      isArray: true
    }),
    trackRelationship({
      source: { name: 'roles', schema: 'auth' },
      destination: { name: 'account_roles', schema: 'auth', foreignKey: 'role' },
      name: 'account_roles',
      isArray: true
    }),
    trackRelationship({
      source: { name: 'roles', schema: 'auth' },
      destination: { name: 'accounts', schema: 'auth', foreignKey: 'default_role' },
      name: 'accounts',
      isArray: true
    })
  ]).then(function (results) {})

  console.log('Finished applying metadata')
}
