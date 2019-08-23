const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar Json

  type Query {
    currentUser: User!
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

  type User {
    id: Int
    username: String
    active: Boolean
    defaultRole: String
    roles: [Role!]
  }
  type Role {
    role: String!
  }
`;

module.exports = typeDefs;
