const { GraphQLClient } = require('graphql-request');
const { HASURA_GQE_ENDPOINT, HASURA_GQE_ADMIN_SECRET } = require('./config');

exports.graphql_client = new GraphQLClient(HASURA_GQE_ENDPOINT, {
  headers: {
    'Content-Type': 'application/json',
    'x-hasura-admin-secret': HASURA_GQE_ADMIN_SECRET,
  },
});
