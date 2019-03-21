const { ApolloServer } = require('apollo-server');
const gql = require('graphql-tag');
const {getData, postData} = require('./helpers');

const typeDefs = gql`
  type User {
    id:       String!
    name:     String!
    balance:  Int!
  }
  
  type Query {
    dummy: String
  }

  type Mutation {
    register(email: String!, password: String!): Boolean
  }
`;

// replace with actual REST endpoint
const restAPIEndpoint = 'http://localhost:3010';

const resolvers = {
    Query: {},
    Mutation: {
        register: async (_, { email, password } ) => {
            const registerResponse = await postData(restAPIEndpoint + '/auth/register', { email, password } );
            console.warn("++++++++" + registerResponse);
            return true;
        }
    }
};

const schema = new ApolloServer({ typeDefs, resolvers });

module.exports = schema;
