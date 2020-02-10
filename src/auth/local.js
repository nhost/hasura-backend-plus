const express = require('express');
const Joi = require('joi');
const Boom = require('@hapi/boom');
const bcrypt = require('bcryptjs');
const uuidv4 = require('uuid/v4');
const jwt = require('jsonwebtoken');
const { graphql_client } = require('../graphql-client');
const auth_functions = require('./auth-functions');

const {
  USER_FIELDS,
  USER_REGISTRATION_AUTO_ACTIVE,
  USER_MANAGEMENT_DATABASE_SCHEMA_NAME,
  REFRESH_TOKEN_EXPIRES,
  JWT_TOKEN_EXPIRES,
  HASURA_GRAPHQL_JWT_SECRET,
  ANONYMOUS_USERS_ACTIVE,
} = require('../config');

let router = express.Router();

const schema_name = USER_MANAGEMENT_DATABASE_SCHEMA_NAME === 'public' ? '' :  USER_MANAGEMENT_DATABASE_SCHEMA_NAME.toString().toLowerCase() + '_';

router.post('/register', async (req, res, next) => {

  let hasura_data;
  let password_hash;

  const schema = Joi.object().keys({
    email: Joi.string().email(),
    username: Joi.string().required(),
    password: Joi.string().required(),
    register_data: Joi.object().allow(null),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return next(Boom.badRequest(error.details[0].message));
  }

  const { email, username, password, register_data } = value;

  // create user account
  const mutation  = `
  mutation (
    $user: users_insert_input!
  ) {
    insert_users (
      objects: [$user]
    ) {
      affected_rows
    }
  }
  `;

  // create user and user_account in same mutation
  try {
    await graphql_client.request(mutation, {
      user: {
        display_name: username,
        email: email,
        active: USER_REGISTRATION_AUTO_ACTIVE,
        secret_token: uuidv4(),
        user_accounts: {
          data: {
            username: username,
            email: email,
            password: await bcrypt.hash(password, 10),
            register_data,
          },
        },
      },
    });
  } catch (e) {
    console.error(e);
    return next(Boom.badImplementation('Unable to create user.'));
  }

  res.send('OK');
});


router.post('/new-password', async (req, res, next) => {
  let hasura_data;
  let password_hash;

  const schema = Joi.object().keys({
    secret_token: Joi.string().uuid({version: ['uuidv4']}).required(),
    password: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return next(Boom.badRequest(error.details[0].message));
  }

  const {
    secret_token,
    password,
  } = value;

  // update password and username activation token
  try {
    password_hash = await bcrypt.hash(password, 10);
  } catch(e) {
    console.error(e);
    return next(Boom.badImplementation(`Unable to generate 'password_hash'`));
  }

  const query = `
  mutation (
    $secret_token: uuid!,
    $password_hash: String!,
    $new_secret_token: uuid!
    $now: timestamptz!
  ) {
    update_user_account_password: update_user_accounts (
      where: {
        _and: [
          {
            user: {
              secret_token: { _eq: $secret_token}
            },
          }, {
            user: {
              secret_token_expires_at: { _gt: $now }
            }
          }
        ]
      }
      _set: {
        password: $password_hash,
      }
    ) {
      affected_rows
    }
    update_secret_token: update_users (
      where: {
        _and: [
          {
            secret_token: { _eq: $secret_token}
          }, {
            secret_token_expires_at: { _gt: $now }
          }
        ]
      }
      _set: {
        secret_token: $new_secret_token
        secret_token_expires_at: $now
      }
    ) {
      affected_rows
    }
  }
  `;

  try {
    const new_secret_token = uuidv4();
    hasura_data = await graphql_client.request(query, {
      secret_token,
      password_hash,
      new_secret_token,
      now: new Date(),
    });
  } catch (e) {
    console.error(e);
    return next(Boom.unauthorized(`Unable to update 'password'`));
  }

  if (hasura_data.update_secret_token.affected_rows === 0) {
    console.error('No user to update password for. Also maybe the secret token has expired');
    return next(Boom.badRequest(`Unable to update password for user`));
  }

  // return 200 OK
  res.send('OK');
});

router.post('/login', async (req, res, next) => {

  // validate username and password
  const schema = Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    console.error(error);
    return next(Boom.badRequest(error.details[0].message));
  }

  const { username, password } = value;

  let query = `
  query (
    $username: String!
  ) {
    user_accounts: user_accounts (
      where: {
        username: { _eq: $username}
      }
    ) {
      password
      user {
        id
        active
        default_role
        user_roles {
          role
        }
        is_anonymous
        ${USER_FIELDS.join('\n')}
      }
    }
  }
  `;

  let hasura_data;
  try {
    hasura_data = await graphql_client.request(query, {
      username,
    });
  } catch (e) {
    console.error(e);
    // console.error('Error connection to GraphQL');
    return next(Boom.unauthorized("Unable to find 'user'"));
  }

  if (hasura_data[`user_accounts`].length === 0) {
    // console.error("No user with this 'username'");
    return next(Boom.unauthorized("Invalid 'username' or 'password'"));
  }

  // check if we got any user back
  const user_account = hasura_data[`user_accounts`][0];

  if (!user_account.user.active) {
    // console.error('User not activated');
    return next(Boom.unauthorized('User not activated.'));
  }

  // see if password hashes matches
  const match = await bcrypt.compare(password, user_account.password);

  if (!match) {
    console.error('Password does not match');
    return next(Boom.unauthorized("Invalid 'username' or 'password'"));
  }

  const jwt_token = auth_functions.generateJwtToken(user_account.user);

  // generate refresh token and put in database
  query = `
  mutation (
    $refresh_token_data: auth_refresh_tokens_insert_input!
  ) {
    insert_auth_refresh_tokens (
      objects: [$refresh_token_data]
    ) {
      affected_rows
    }
  }
  `;

  const refresh_token = uuidv4();
  try {
    await graphql_client.request(query, {
      refresh_token_data: {
        user_id: user_account.user.id,
        refresh_token: refresh_token,
        expires_at: new Date(new Date().getTime() + (REFRESH_TOKEN_EXPIRES * 60 * 1000)), // convert from minutes to milli seconds
      },
    });
  } catch (e) {
    console.error(e);
    return next(Boom.badImplementation("Could not update 'refresh token' for user"));
  }

  // return jwt token and refresh token to client
  res.json({
    refresh_token,
    jwt_token,
  });
});

if (ANONYMOUS_USERS_ACTIVE) {

  // anonymous users
  router.post('/sign-in-anonymously', async (req, res, next) => {

    const mutation  = `
    mutation (
      $user: users_insert_input!
    ) {
      insert_users (
        objects: [$user]
      ) {
        user: returning {
          id
          active
          default_role
          user_roles {
            role
          }
          is_anonymous
          ${USER_FIELDS.join('\n')}
        }
      }
    }
    `;

    let hasura_data;

    // create user and user_account in same mutation
    try {
      hasura_data = await graphql_client.request(mutation, {
        user: {
          display_name: 'Anonymous users',
          is_anonymous: true,
          default_role: 'anonymous',
          active: true,
        },
      });
    } catch (e) {
      console.error(e);
      return next(Boom.badImplementation('Unable to create user.'));
    }

    const user = hasura_data.insert_users.user[0];

    // generate JWT and refresh token, just as login
    const jwt_token = auth_functions.generateJwtToken(user);

    // generate refresh token and put in database
    query = `
    mutation (
      $refresh_token_data: auth_refresh_tokens_insert_input!
    ) {
      insert_auth_refresh_tokens (
        objects: [$refresh_token_data]
      ) {
        affected_rows
      }
    }
    `;
    const refresh_token = uuidv4();

    // convert from minutes to milli seconds
    const expires_at = new Date(new Date().getTime() + (REFRESH_TOKEN_EXPIRES * 60 * 1000));

    try {
      await graphql_client.request(query, {
        refresh_token_data: {
          user_id: user.id,
          refresh_token: refresh_token,
          expires_at: expires_at,
        },
      });
    } catch (e) {
      console.error(e);
      return next(Boom.badImplementation("Could not update 'refresh token' for user"));
    }

    // return jwt token and refresh token to client
    res.json({
      refresh_token,
      jwt_token,
    });
  });
}

module.exports = router;
