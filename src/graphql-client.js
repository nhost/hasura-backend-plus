const { GraphQLClient } = require('graphql-request');
const { HASURA_GRAPHQL_ENDPOINT, HASURA_GRAPHQL_ACCESS_KEY } = require('./config');

exports.graphql_client = new GraphQLClient(HASURA_GRAPHQL_ENDPOINT, {
	headers: {
		'Content-Type': 'application/json',
		'X-Hasura-Access-Key': HASURA_GRAPHQL_ACCESS_KEY,
	},
});
