const { ApolloServer } = require('apollo-server');
const gql = require('graphql-tag');
const {getData, postData} = require('./helpers');

const typeDefs = gql`
  type User {
    id:       String!
    name:     String!
    balance:  Int!
  }

  type Mutation {
    register(email: String!, password: Int!): Boolean
  }
`;

// replace with actual REST endpoint
const restAPIEndpoint = 'https://localhost:3010';

const resolvers = {
    Mutation: {
        register: async (_, { username, password } ) => {
            return await postData(restAPIEndpoint + '/auth/register', { username, password } );
        }

    }
};

const schema = new ApolloServer({ typeDefs, resolvers });

module.exports = schema;
