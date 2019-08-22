const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar Json

  type Query {
    hello: String
  }

  type Mutation {
    register(username: String!, password: String!, data: Json): Boolean!
    activate(token: String!): Boolean!
    resetPassword(token: String!, password: String!): Boolean!
    login(username: String!, password: String!): AuthPayload!
    refetchToken(userId: Int!, refetchToken: String!): AuthPayload!
  }

  type AuthPayload {
    jwtToken: String!
    refetchToken: String!
    userId: Int!
  }
`;

module.exports = typeDefs;
