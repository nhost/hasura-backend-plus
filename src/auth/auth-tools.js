const jwt = require('jsonwebtoken');

const Boom = require('boom');

const { graphql_client } = require('../graphql-client');


const {
  USER_MANAGEMENT_DATABASE_SCHEMA_NAME,
  USER_FIELDS,
  HASURA_GQE_JWT_SECRET,
  JWT_TOKEN_EXPIRES,
} = require('../config');

const schema_name = USER_MANAGEMENT_DATABASE_SCHEMA_NAME === 'public' ? '' :  USER_MANAGEMENT_DATABASE_SCHEMA_NAME.toString().toLowerCase() + '_';


module.exports = {
  checkUserExistAndActivated: async function(next, username) {
    let query = `
  query (
    $username: String!
  ) {
    ${schema_name}users (
      where: {
        username: { _eq: $username}
      }
    ) {
      id
      username
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

    let hasura_data;
    try {
      hasura_data = await graphql_client.request(query, {
        username,
      });
    } catch (e) {
      console.error('Error connection to GraphQL');
      console.error(e);
      return next(Boom.unauthorized('Invalid or blocked username'));
    }

    if (hasura_data[`${schema_name}users`].length === 0) {
      console.error('No user with that username');
      return next(Boom.unauthorized('Invalid or blocked username'));
    }

    // check if we got any user back
    const user = hasura_data[`${schema_name}users`][0];

    if (!user.active) {
      console.error('User not activated');
      return next(Boom.unauthorized('User not activated'));
    }

    // console.warn('user: ' + JSON.stringify(user, null, 2));
    return user;

  },
  generateJwtToken: function(user) {

    let custom_claims = {};

    USER_FIELDS.forEach(user_field => {
      custom_claims['x-hasura-' + user_field.replace('_', '-')] = user[user_field].toString();
    });

    const user_roles = user.roles.map(role => {
      return role.role;
    });

    if (!user_roles.includes(user.default_role)) {
      user_roles.push(user.default_role);
    }

    return jwt.sign({
      'https://hasura.io/jwt/claims': {
        'x-hasura-allowed-roles': user_roles,
        'x-hasura-default-role': user.default_role,
        'x-hasura-user-id': user.id.toString(),
        ...custom_claims,
      },
    }, HASURA_GQE_JWT_SECRET.key, {
      algorithm: HASURA_GQE_JWT_SECRET.type,
      expiresIn: `${JWT_TOKEN_EXPIRES}m`,
    });
  },
};
