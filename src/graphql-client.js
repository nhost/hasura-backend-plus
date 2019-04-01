const { GraphQLClient } = require('graphql-request');
const { HASURA_GRAPHQL_ENDPOINT, HASURA_GRAPHQL_ADMIN_SECRET } = require('./config');

exports.graphql_client = new GraphQLClient(HASURA_GRAPHQL_ENDPOINT, {
  headers: {
    'Content-Type': 'application/json',
    'x-hasura-admin-secret': HASURA_GRAPHQL_ADMIN_SECRET,
  },
});
