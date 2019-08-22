const { ApolloServer, gql, ApolloError, AuthenticationError } = require('apollo-server-express');
const bcrypt = require('bcryptjs');
const uuidv4 = require('uuid/v4');
const { graphql_client } = require( '../graphql-client' );
const { generateJwtToken } = require('../auth/auth-tools');

const {
  USER_FIELDS,
  USER_REGISTRATION_AUTO_ACTIVE,
  USER_MANAGEMENT_DATABASE_SCHEMA_NAME,
  REFETCH_TOKEN_EXPIRES,
  JWT_TOKEN_EXPIRES,
} = require('../config');

const schema_name = USER_MANAGEMENT_DATABASE_SCHEMA_NAME === 'public' ? '' : USER_MANAGEMENT_DATABASE_SCHEMA_NAME.toString().toLowerCase() + '_';

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

const resolvers = {
  Query: {
    hello: () => 'Hello world!',
  },
  Mutation: {
    login: async ( parent, { username, password }, ctx, info ) => {
      const userQuery = `query ($username: String!) {
        users: ${schema_name}users (
          where: {
            username: { _eq: $username}
          }
        ) {
          id
          password
          active
          default_role
          roles: users_x_roles {
            role
          }
          ${USER_FIELDS.join('\n')}
        }
      }
      `;


      const { users: [ user ] } = await graphql_client.request(userQuery, { username });

      if (!user) {
        throw new AuthenticationError('Invalid username or password');
      }

      if (!user.active) {
        throw new AuthenticationError('User is not activated');
      }

      const match = await bcrypt.compare( password, user.password );

      if (!match) {
        throw new AuthenticationError( 'Invalid username or password' );
      }

      const jwtToken = generateJwtToken(user);
      const refetchToken = uuidv4();

      const addRefetchTokenMutation = `mutation ($refetch_token_data: ${schema_name}refetch_tokens_insert_input!) {
        insert_${schema_name}refetch_tokens (
          objects: [$refetch_token_data]
        ) {
          affected_rows
        }
      }
      `;

      try {
        await graphql_client.request(addRefetchTokenMutation, {
          refetch_token_data: {
            user_id: user.id,
            refetch_token: refetchToken,
            expires_at: new Date(new Date().getTime() + (REFETCH_TOKEN_EXPIRES * 60 * 1000)), // convert from minutes to milli seconds
          },
        });
      } catch (error) {
        throw new Error('Could not update refetch token for user');
      }

      return {
        jwtToken,
        refetchToken,
        userId: user.id,
      };
    },
  },
};

const graphql = new ApolloServer({
  typeDefs,
  resolvers,
  playground: process.env.NODE_ENV !== 'production',
});

module.exports = graphql;
