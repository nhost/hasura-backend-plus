const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Query {
    hello: String
  }
  type Mutation {
    login(username: String!, password: String!): AuthPayload!
  }
  type AuthPayload {
    jwtToken: String!
    refetchToken: String!
    userId: String!
  }
`;

module.exports = typeDefs;
