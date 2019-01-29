const { GraphQLClient } = require('graphql-request');
const { GRAPHQL_ENDPOINT, HASURA_ACCESS_KEY } = require('./config');

exports.graphql_client = new GraphQLClient(GRAPHQL_ENDPOINT, {
	headers: {
		'Content-Type': 'application/json',
		'X-Hasura-Access-Key': HASURA_ACCESS_KEY,
	},
});
