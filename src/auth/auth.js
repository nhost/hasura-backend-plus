const express = require('express');
const Joi = require('joi');
const Boom = require('boom');
const bcrypt = require('bcryptjs');
const uuidv4 = require('uuid/v4');
const { graphql_client } = require('../graphql-client');

const {
  USER_FIELDS,
  USER_REGISTRATION_AUTO_ACTIVE,
  USER_MANAGEMENT_DATABASE_SCHEMA_NAME,
  REFETCH_TOKEN_EXPIRES,
  JWT_TOKEN_EXPIRES,
} = require('../config');

const auth_tools = require('./auth-tools');

let router = express.Router();

const schema_name = USER_MANAGEMENT_DATABASE_SCHEMA_NAME === 'public' ? '' :  USER_MANAGEMENT_DATABASE_SCHEMA_NAME.toString().toLowerCase() + '_';

router.post('/register', async (req, res, next) => {

  let hasura_data;
  let password_hash;

  const schema = Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().required(),
    register_data: Joi.object().allow(null),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return next(Boom.badRequest(error.details[0].message));
  }

  const { username, password, register_data } = value;

  // check for duplicates
  let query = `
  query (
    $username: String!
  ) {
    ${schema_name}users (
      where: {
        username: { _eq: $username }
      }
    ) {
      id
    }
  }
  `;

  try {
    hasura_data = await graphql_client.request(query, {
      username,
    });
  } catch (e) {
    console.error(e);
    return next(Boom.badImplementation("Unable to check for 'username' duplication"));
  }

  if (hasura_data[`${schema_name}users`].length !== 0) {
    return next(Boom.unauthorized("The 'username' already exist"));
  }

  // generate password_hash
  try {
    password_hash = await bcrypt.hash(password, 10);
  } catch(e) {
    console.error(e);
    return next(Boom.badImplementation("Unable to generate 'password hash'"));
  }

  // insert user
  query = `
  mutation (
    $user: ${schema_name}users_insert_input!
  ) {
    insert_${schema_name}users(
      objects: [$user]
    ) {
      affected_rows
    }
  }
  `;

  try {
    await graphql_client.request(query, {
      user: {
        username,
        password: password_hash,
        secret_token: uuidv4(),
        active: USER_REGISTRATION_AUTO_ACTIVE,
        register_data,
      },
    });
  } catch (e) {
    console.error(e);
    return next(Boom.badImplementation('Unable to create user.'));
  }

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
  ) {
    update_${schema_name}users (
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
  }
  `;

  try {
    hasura_data = await graphql_client.request(query, {
      secret_token,
      new_secret_token: uuidv4(),
    });
  } catch (e) {
    console.error(e);
    return next(Boom.unauthorized('Unable to find account for activation.'));
  }

  if (hasura_data[`update_${schema_name}users`].affected_rows === 0) {
    // console.error('Account already activated');
    return next(Boom.unauthorized('Account is already activated or there is no account.'));
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
  mutation  (
    $secret_token: uuid!,
    $password_hash: String!,
    $new_secret_token: uuid!
  ) {
    update_${schema_name}users (
      where: {
        secret_token: { _eq: $secret_token}
      }
      _set: {
        password: $password_hash,
        secret_token: $new_secret_token
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
    });
  } catch (e) {
    console.error(e);
    return next(Boom.unauthorized(`Unable to update 'password'`));
  }


  if (hasura.update_users.affected_rows === 0) {
    console.error('no user to update password for');
    return next(Boom.badImplementation(`Unable to update password for user`));
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
    return next(Boom.badRequest(error.details[0].message));
  }

  const { username, password } = value;

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
    console.error(e);
    // console.error('Error connection to GraphQL');
    return next(Boom.unauthorized("Unable to find 'user'"));
  }

  if (hasura_data[`${schema_name}users`].length === 0) {
    // console.error("No user with this 'username'");
    return next(Boom.unauthorized("Invalid 'username' or 'password'"));
  }

  // check if we got any user back
  const user = hasura_data[`${schema_name}users`][0];

  if (!user.active) {
    // console.error('User not activated');
    return next(Boom.unauthorized('User not activated.'));
  }

  // see if password hashes matches
  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    console.error('Password does not match');
    return next(Boom.unauthorized("Invalid 'username' or 'password'"));
  }

  const jwt_token = auth_tools.generateJwtToken(user);

  // generate refetch token and put in database
  query = `
  mutation (
    $refetch_token_data: ${schema_name}refetch_tokens_insert_input!
  ) {
    insert_${schema_name}refetch_tokens (
      objects: [$refetch_token_data]
    ) {
      affected_rows
    }
  }
  `;

  const refetch_token = uuidv4();
  try {
    await graphql_client.request(query, {
      refetch_token_data: {
        user_id: user.id,
        refetch_token: refetch_token,
        expires_at: new Date(new Date().getTime() + (REFETCH_TOKEN_EXPIRES * 60 * 1000)), // convert from minutes to milli seconds
      },
    });
  } catch (e) {
    console.error(e);
    return next(Boom.badImplementation("Could not update 'refetch token' for user"));
  }

  res.cookie('jwt_token', jwt_token, {
    maxAge: JWT_TOKEN_EXPIRES * 60 * 1000, // convert from minute to milliseconds
    httpOnly: true,
  });

  // return jwt token and refetch token to client
  res.json({
    jwt_token,
    refetch_token,
    user_id: user.id,
  });
});

router.post('/refetch-token', async (req, res, next) => {

  // validate username and password
  const schema = Joi.object().keys({
    user_id: Joi.required(),
    refetch_token: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return next(Boom.badRequest(error.details[0].message));
  }

  const { refetch_token, user_id } = value;

  let query = `
  query get_refetch_token(
    $refetch_token: uuid!,
    $user_id: Int!
    $current_timestampz: timestamptz!,
  ) {
    ${schema_name}refetch_tokens (
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

  let hasura_data;
  try {
    hasura_data = await graphql_client.request(query, {
      refetch_token,
      user_id,
      current_timestampz: new Date(),
    });
  } catch (e) {
    console.error(e);
    // console.error('Error connection to GraphQL');
    return next(Boom.unauthorized("Invalid 'refetch_token' or 'user_id'"));
  }

  if (hasura_data[`${schema_name}refetch_tokens`].length === 0) {
    // console.error('Incorrect user id or refetch token');
    return next(Boom.unauthorized("Invalid 'refetch_token' or 'user_id'"));
  }

  const user = hasura_data[`${schema_name}refetch_tokens`][0].user;

  // delete current refetch token and generate a new, and insert the
  // new refetch_token in the database
  // two mutations as transaction
  query = `
  mutation (
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

  const new_refetch_token = uuidv4();
  try {
    await graphql_client.request(query, {
      old_refetch_token: refetch_token,
      new_refetch_token_data: {
        user_id: user_id,
        refetch_token: new_refetch_token,
        expires_at: new Date(new Date().getTime() + (REFETCH_TOKEN_EXPIRES * 60 * 1000)), // convert from minutes to milli seconds
      },
      user_id,
    });
  } catch (e) {
    console.error(e);
    // console.error('unable to create new refetch token and delete old');
    return next(Boom.unauthorized("Invalid 'refetch_token' or 'user_id'"));
  }

  // generate new jwt token
  const jwt_token = auth_tools.generateJwtToken(user);

  res.cookie('jwt_token', jwt_token, {
    maxAge: JWT_TOKEN_EXPIRES * 60 * 1000,
    httpOnly: true,
  });

  res.json({
    jwt_token,
    refetch_token: new_refetch_token,
    user_id,
  });
});

module.exports = router;
