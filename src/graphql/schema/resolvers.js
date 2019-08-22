const { AuthenticationError } = require( 'apollo-server-express' );
const bcrypt = require('bcryptjs');
const uuidv4 = require('uuid/v4');
const { graphql_client } = require( '../../graphql-client' );
const { generateJwtToken } = require('../../auth/auth-tools');

const {
  USER_FIELDS,
  USER_REGISTRATION_AUTO_ACTIVE,
  USER_MANAGEMENT_DATABASE_SCHEMA_NAME,
  REFETCH_TOKEN_EXPIRES,
  JWT_TOKEN_EXPIRES,
} = require('../../config');

const schema_name = USER_MANAGEMENT_DATABASE_SCHEMA_NAME === 'public' ? '' : USER_MANAGEMENT_DATABASE_SCHEMA_NAME.toString().toLowerCase() + '_';

const resolvers = {
  Query: {
    hello: () => 'Hello world!',
  },
  Mutation: {
    register: async ( parent, { username, password, data }, ctx, info ) => {
      const checkDuplicatesQuery = `query ($username: String!) {
        users: ${schema_name}users (
          where: {
            username: { _eq: $username }
          }
        ) {
          id
        }
      }`;

      const { users } = await graphql_client.request( checkDuplicatesQuery, { username } );

      if ( users.length ) {
        throw new AuthenticationError( 'This username already exists' );
      }

      const passwordHash = await bcrypt.hash( password, 10 );

      const insertUserMutation = `mutation ($user: ${schema_name}users_insert_input!) {
        insert_${schema_name}users(
          objects: [$user]
        ) {
          affected_rows
        }
      }`;

      try {
        await graphql_client.request(insertUserMutation, {
          user: {
            username,
            password: passwordHash,
            secret_token: uuidv4(),
            active: USER_REGISTRATION_AUTO_ACTIVE,
            register_data: data,
          },
        });
      } catch (error) {
        throw new Error( 'Unable to create user' );
      }

      return true;
    },
    activate: async ( parent, { token }, ctx, info ) => {
      const activateAccountMutation = `mutation activate_account (
        $secret_token: uuid!
        $new_secret_token: uuid!
      ) {
        users: update_${schema_name}users (
          where: {
            _and: [
              {
                secret_token: { _eq: $secret_token}
              },{
                active: { _eq: false}
              }
            ]
          }
          _set: {
            active: true,
            secret_token: $new_secret_token,
          }
        ) {
          affected_rows
        }
      }`;

      const { users: { affected_rows} } = await graphql_client.request(activateAccountMutation, {
        secret_token: token,
        new_secret_token: uuidv4(),
      });

      if (!affected_rows) {
        throw new AuthenticationError('Account is already activated');
      }

      return true;
    },
    login: async ( parent, { username, password }, ctx, info ) => {
      const userQuery = `query ($username: String!) {
        users: ${schema_name }users (
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
          ${USER_FIELDS.join( '\n' ) }
        }
      }
      `;

      const { users: [user] } = await graphql_client.request( userQuery, { username } );

      if ( !user ) {
        throw new AuthenticationError( 'Invalid username or password' );
      }

      if ( !user.active ) {
        throw new AuthenticationError( 'User is not activated' );
      }

      const match = await bcrypt.compare( password, user.password );

      if ( !match ) {
        throw new AuthenticationError( 'Invalid username or password' );
      }

      const jwtToken = generateJwtToken( user );
      const refetchToken = uuidv4();

      const addRefetchTokenMutation = `mutation ($refetch_token_data: ${ schema_name }refetch_tokens_insert_input!) {
        insert_${schema_name }refetch_tokens (
          objects: [$refetch_token_data]
        ) {
          affected_rows
        }
      }
      `;

      try {
        await graphql_client.request( addRefetchTokenMutation, {
          refetch_token_data: {
            user_id: user.id,
            refetch_token: refetchToken,
            expires_at: new Date( new Date().getTime() + ( REFETCH_TOKEN_EXPIRES * 60 * 1000 ) ), // convert from minutes to milli seconds
          },
        } );
      } catch ( error ) {
        throw new Error( 'Could not update refetch token for user' );
      }

      return {
        jwtToken,
        refetchToken,
        userId: user.id,
      };
    },
    refetchToken: async ( parent, { userId, refetchToken }, ctx, info ) => {
      const refetchTokensQuery = `query get_refetch_token(
        $refetch_token: uuid!,
        $user_id: Int!
        $current_timestampz: timestamptz!,
      ) {
        refetch_tokens: ${schema_name}refetch_tokens (
          where: {
            _and: [{
              refetch_token: { _eq: $refetch_token }
            }, {
              user_id: { _eq: $user_id }
            }, {
              user: { active: { _eq: true }}
            }, {
              expires_at: { _gte: $current_timestampz }
            }]
          }
        ) {
          user {
            id
            active
            default_role
            roles: users_x_roles {
              role
            }
            ${USER_FIELDS.join('\n')}
          }
        }
      }
      `;

      const { refetch_tokens: users } = await graphql_client.request(refetchTokensQuery, {
        refetch_token: refetchToken,
        user_id: userId,
        current_timestampz: new Date(),
      });

      if (!users.length) {
        throw new AuthenticationError( 'Invalid refetch token or user id' );
      }

      const [{user}] = users;

      const updateRefetchTokensMutation = `mutation (
          $old_refetch_token: uuid!,
          $new_refetch_token_data: refetch_tokens_insert_input!
          $user_id: Int!
        ) {
          delete_${schema_name}refetch_tokens (
            where: {
              _and: [{
                refetch_token: { _eq: $old_refetch_token }
              }, {
                user_id: { _eq: $user_id }
              }]
            }
          ) {
            affected_rows
          }
          insert_${schema_name}refetch_tokens (
            objects: [$new_refetch_token_data]
          ) {
            affected_rows
          }
        }
      `;

      const newRefetchToken = uuidv4();
      const jwtToken = generateJwtToken(user);

      try {
        await graphql_client.request(updateRefetchTokensMutation, {
          old_refetch_token: refetchToken,
          new_refetch_token_data: {
            user_id: userId,
            refetch_token: newRefetchToken,
            expires_at: new Date(new Date().getTime() + (REFETCH_TOKEN_EXPIRES * 60 * 1000)),
          },
          user_id: userId,
        });
      } catch (e) {
        throw new AuthenticationError('Invalid refetch token or user id');
      }

      return {
        jwtToken,
        userId,
        refetchToken: newRefetchToken,
      };
    },
  },
};

module.exports = resolvers;
