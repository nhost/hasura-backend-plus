const express = require('express');
const Joi = require('joi');
const Boom = require('boom');
const bcrypt = require('bcryptjs');
const uuidv4 = require('uuid/v4');
const jwt = require('jsonwebtoken');
const { graphql_client } = require('../graphql-client');

const {
  USER_FIELDS,
  USER_REGISTRATION_AUTO_ACTIVE,
  USER_MANAGEMENT_DATABASE_SCHEMA_NAME,
  REFRESH_TOKEN_EXPIRES,
  JWT_TOKEN_EXPIRES,
  HASURA_GRAPHQL_JWT_SECRET,
  STORAGE_ACTIVE,
} = require('../config');

const auth_functions = require('./auth-functions');

let router = express.Router();

const schema_name = USER_MANAGEMENT_DATABASE_SCHEMA_NAME === 'public' ? '' :  USER_MANAGEMENT_DATABASE_SCHEMA_NAME.toString().toLowerCase() + '_';

router.post('/refresh-token', async (req, res, next) => {

  // validate username and password
  const schema = Joi.object().keys({
    refresh_token: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return next(Boom.badRequest(error.details[0].message));
  }

  const { refresh_token } = value;

  let query = `
  query get_refresh_token(
    $refresh_token: uuid!,
    $current_timestampz: timestamptz!,
  ) {
    refresh_tokens: ${schema_name}refresh_tokens (
      where: {
        _and: [{
          refresh_token: { _eq: $refresh_token }
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
        user_roles {
          role
        }
        ${USER_FIELDS.join('\n')}
      }
    }
  }
  `;

  let hasura_data;
  try {
    hasura_data = await graphql_client.request(query, {
      refresh_token,
      current_timestampz: new Date(),
    });
  } catch (e) {
    console.error(e);
    // console.error('Error connection to GraphQL');
    return next(Boom.unauthorized("Invalid 'refresh_token'"));
  }

  if (hasura_data[`refresh_tokens`].length === 0) {
    // console.error('Incorrect user id or refresh token');
    return next(Boom.unauthorized("Invalid 'refresh_token'"));
  }

  const user = hasura_data[`refresh_tokens`][0].user;

  // delete current refresh token and generate a new, and insert the
  // new refresh_token in the database
  // two mutations as transaction
  query = `
  mutation (
    $old_refresh_token: uuid!,
    $new_refresh_token_data: refresh_tokens_insert_input!
  ) {
    delete_refresh_token: delete_${schema_name}refresh_tokens (
      where: {
        refresh_token: { _eq: $old_refresh_token }
      }
    ) {
      affected_rows
    }
    insert_refresh_token: insert_${schema_name}refresh_tokens (
      objects: [$new_refresh_token_data]
    ) {
      affected_rows
    }
  }
  `;

  const new_refresh_token = uuidv4();
  // convert from minutes to milli seconds
  const new_refresh_token_expires_at = new Date(new Date().getTime() + (REFRESH_TOKEN_EXPIRES * 60 * 1000));

  try {
    await graphql_client.request(query, {
      old_refresh_token: refresh_token,
      new_refresh_token_data: {
        user_id: user.id,
        refresh_token: new_refresh_token,
        expires_at: new_refresh_token_expires_at,
      },
    });
  } catch (e) {
    console.error(e);
    // console.error('unable to create new refresh token and delete old');
    return next(Boom.unauthorized("Invalid 'refresh_token'"));
  }

  // generate new jwt token
  const jwt_token = auth_functions.generateJwtToken(user);
  const storage_jwt_token = auth_functions.generateStorageJwtToken(user);

  res.json({
    refresh_token: new_refresh_token,
    storage_jwt_token,
    jwt_token,
  });
});

router.post('/logout', async (req, res, next) => {
  // TODO: Remove current refresh token from DB
  res.send('OK');
});

router.post('/logout-all', async (req, res, next) => {

  // get refresh token
  const schema = Joi.object().keys({
    refresh_token: Joi.string().uuid().required(),
  });

  const { error, value } = schema.validate(req.body);

  const { refresh_token } = value;

  let query = `
  query (
    $refresh_token: uuid!,
    $current_timestampz: timestamptz!,
  ) {
    refresh_tokens: ${schema_name}refresh_tokens (
      where: {
        _and: [{
          refresh_token: { _eq: $refresh_token }
        }, {
          expires_at: { _gte: $current_timestampz }
        }]
      }
    ) {
      user {
        id
      }
    }
  }
  `;

  let hasura_data;
  try {
    hasura_data = await graphql_client.request(query, {
      refresh_token,
      current_timestampz: new Date(),
    });
  } catch (e) {
    console.error(e);
    // console.error('Error connection to GraphQL');
    return next(Boom.unauthorized("Invalid 'refresh_token'"));
  }
  const { user } = hasura_data.refresh_tokens[0];

  // delete all refresh tokens associated with the user id
  let mutation = `
  mutation (
    $user_id: uuid!,
  ) {
    delete_refresh_token: delete_${schema_name}refresh_tokens (
      where: {
        user_id: { _eq: $user_id }
      }
    ) {
      affected_rows
    }
  }
  `;

  try {
    hasura_data = await graphql_client.request(mutation, {
      user_id: user.id,
    });
  } catch (e) {
    console.error(e);
    // console.error('Error connection to GraphQL');
    return next(Boom.unauthorized('Unable to delete refresh tokens'));
  }

  // clear cookies
  res.cookie('storage_jwt_token', '', {
    maxAge: 0,
    httpOnly: true,
  });
  res.cookie('refresh_token', '', {
    maxAge: 0,
    httpOnly: true,
  });

  res.send('OK');
});

router.post('/activate-account', async (req, res, next) => {
  let hasura_data;

  const schema = Joi.object().keys({
    secret_token: Joi.string().uuid({version: ['uuidv4']}).required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return next(Boom.badRequest(error.details[0].message));
  }

  const {
    secret_token,
  } = value;

  const query = `
  mutation activate_account (
    $secret_token: uuid!
    $new_secret_token: uuid!
    $now: timestamptz!
  ) {
    update_users: update_${schema_name}users (
      where: {
        _and: [
          {
            secret_token: { _eq: $secret_token }
          }, {
            secret_token_expires_at: { _gt: $now }
          },{
            active: { _eq: false }
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
  }
  `;

  try {
    hasura_data = await graphql_client.request(query, {
      secret_token,
      new_secret_token: uuidv4(),
      now: new Date(),
    });
  } catch (e) {
    console.error(e);
    return next(Boom.unauthorized('Unable to find account for activation.'));
  }

  if (hasura_data[`update_users`].affected_rows === 0) {
    // console.error('Account already activated');
    return next(Boom.unauthorized('Account is already activated, the secret token has expired or there is no account.'));
  }

  res.send('OK');
});

router.get('/user', async (req, res, next) => {

  // get jwt token
  if (!req.headers.authorization) {
    return next(Boom.badRequest('no authorization header'));
  }

  const auth_split = req.headers.authorization.split(' ');

  if (auth_split[0] !== 'Bearer' || !auth_split[1]) {
    return next(Boom.badRequest('malformed authorization header'));
  }

  // get jwt token
  const token = auth_split[1];

  // verify jwt token is OK
  let claims;
  try {
    claims = jwt.verify(
      token,
      HASURA_GRAPHQL_JWT_SECRET.key,
      {
        algorithms: HASURA_GRAPHQL_JWT_SECRET.type,
      }
    );
  } catch (e) {
    console.error(e);
    return next(Boom.unauthorized('Incorrect JWT Token'));
  }

  // get user_id from jwt claim
  const user_id = claims['https://hasura.io/jwt/claims']['x-hasura-user-id'];

  // get user from hasura (include ${USER_FIELDS.join('\n')})
  let query = `
  query (
    $id: uuid!
  ) {
    user: ${schema_name}users_by_pk(id: $id) {
      id
      display_name
      email
      avatar_url
      active
      default_role
      roles: user_roles {
        role
      }
      ${USER_FIELDS.join('\n')}
    }
  }
  `;

  let hasura_data;
  try {
    hasura_data = await graphql_client.request(query, {
      id: user_id,
    });
  } catch (e) {
    console.error(e);
    return next(Boom.unauthorized("Unable to get 'user'"));
  }

  // return user as json response
  res.json({
    user: hasura_data.user,
  });
});



module.exports = router;
