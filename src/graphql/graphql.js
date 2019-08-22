const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./schema/typedefs');
const resolvers = require('./schema/resolvers');

const graphql = new ApolloServer({
  typeDefs,
  resolvers,
  playground: process.env.NODE_ENV !== 'production',
});

module.exports = graphql;
