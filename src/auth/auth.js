const express = require('express');
const Joi = require('joi');
const Boom = require('boom');
const bcrypt = require('bcryptjs');
const uuidv4 = require('uuid/v4');
const { graphql_client } = require('../graphql-client');
const crypto = require('crypto');
const totp = require('otplib/totp');

totp.options = {
  crypto: crypto,
  step: 60
};

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






router.post('/2fa/generateTOTP', async (req, res, next) => {

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
    console.error('Error connection to GraphQL');
    console.error(e);
    return next(Boom.unauthorized('Invalid username or password'));
  }

  if (hasura_data[`${schema_name}users`].length === 0) {
    console.error('No user with that username');
    return next(Boom.unauthorized('Invalid username or password'));
  }

  // check if we got any user back
  const user = hasura_data[`${schema_name}users`][0];

  if (!user.active) {
    console.error('User not activated');
    return next(Boom.unauthorized('User not activated'));
  }

  // see if password hashes matches
  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    console.error('Password does not match');
    return next(Boom.unauthorized('Invalid username or password'));
  }
  console.warn('user: ' + JSON.stringify(user, null, 2));

  try {
    const secret = username + 'KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLD';
    const token = totp.generate(secret);
    // totp.check(...)
    // totp.verify(...)
    console.warn("2FA Token is (valid for 60 second): " + token);

    // TODO: Later we need remove below code and send token just through SMS or Email
    res.send(token);
    res.send('OK');
  } catch (e) {
    console.error(e);
    return next(Boom.unauthorized('Account is already activated, there is no account or unable to activate account'));
  }
});


router.post('/2fa/login', async (req, res, next) => {

  // validate username and password
  const schema = Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().required(),
    totp_token: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return next(Boom.badRequest(error.details[0].message));
  }

  const { username, password, totp_token } = value;

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
    console.error('Error connection to GraphQL');
    console.error(e);
    return next(Boom.unauthorized('Invalid username or password'));
  }

  if (hasura_data[`${schema_name}users`].length === 0) {
    console.error('No user with that username');
    return next(Boom.unauthorized('Invalid username or password'));
  }

  // check if we got any user back
  const user = hasura_data[`${schema_name}users`][0];

  if (!user.active) {
    console.error('User not activated');
    return next(Boom.unauthorized('User not activated'));
  }

  // see if password hashes matches
  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    console.error('Password does not match');
    return next(Boom.unauthorized('Invalid username or password'));
  }
  console.warn('user: ' + JSON.stringify(user, null, 2));






  const secret = username + 'KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLD';
  const isValid = totp.check(totp_token, secret);
  if (!isValid) {
    console.error('TOTP token not valid');
    return next(Boom.unauthorized('TOTP token not valid'));
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
    return next(Boom.badImplementation('Could not update refetch token for user'));
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
























router.post('/register', async (req, res, next) => {

  let hasura_data;
  let password_hash;

  const schema = Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return next(Boom.badRequest(error.details[0].message));
  }

  const { username, password } = value;

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
    console.log(e);
    return next(Boom.badImplementation('Unable to check for duplicates'));
  }

  if (hasura_data[`${schema_name}users`].length !== 0) {
    return next(Boom.unauthorized('The username is already in use'));
  }

  // generate password_hash
  try {
    password_hash = await bcrypt.hash(password, 10);
  } catch(e) {
    return next(Boom.badImplementation('Unable to generate password hash'));
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
      },
    });
  } catch (e) {
    console.error(e);
    return next(Boom.badImplementation('Unable to create user'));
  }

  res.send('OK');
});

router.get('/activate-account', async (req, res, next) => {
  let hasura_data;

  const schema = Joi.object().keys({
    username: Joi.string().required(),
    secret_token: Joi.string().uuid({version: ['uuidv4']}).required(),
  });

  const { error, value } = schema.validate(req.query);

  if (error) {
    return next(Boom.badRequest(error.details[0].message));
  }

  const {
    username,
    secret_token,
  } = value;

  const query = `
  mutation activate_account (
    $username: String!,
    $secret_token: uuid!
    $new_super_token: uuid!
  ) {
    update_${schema_name}users (
      where: {
        _and: [
          {
            username: { _eq: $username}
          },{
            secret_token: { _eq: $secret_token}
          },{
            active: { _eq: false}
          },
        ]
      }
      _set: {
        active: true,
        secret_token: $new_super_token,
      }
    ) {
      affected_rows
    }
  }
  `;

  try {
    hasura_data = await graphql_client.request(query, {
      username,
      secret_token,
      new_super_token: uuidv4(),
    });
  } catch (e) {
    console.error(e);
    return next(Boom.unauthorized('Account is already activated, there is no account or unable to activate account'));
  }

  if (hasura_data[`update_${schema_name}users`].affected_rows === 0) {
    console.error('Account already activated');
    return next(Boom.unauthorized('Account is already activated, there is no account or unable to activate account'));
  }

  res.send('OK');
});

router.post('/new-password', async (req, res, next) => {
  let hasura_data;
  let password_hash;

  const schema = Joi.object().keys({
    username: Joi.string().required(),
    secret_token: Joi.string().uuid({version: ['uuidv4']}).required(),
    password: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return next(Boom.badRequest(error.details[0].message));
  }

  const {
    username,
    secret_token,
    password,
  } = value;

  console.log({username});
  console.log({secret_token});
  console.log({password});

  // check username and ActivationToken
  // check for duplicates
  let query = `
  query (
    $username: String!,
    $secret_token: uuid!
  ) {
    ${schema_name}users (
      where: {
        _and: [{
          username: { _eq: $username}
        },{
          secret_token: { _eq: $secret_token}
        }]
      }
    ) {
      id
    }
  }
  `;

  try {
    hasura_data = await graphql_client.request(query, {
      username,
      secret_token,
    });
  } catch (e) {
    console.error(e);
    console.error('activation token not valid');
    return next(Boom.unauthorized('secret_token not valid'));
  }

  if (hasura_data[`${schema_name}users`].length === 0) {
    console.error('No user with that username');
    return next(Boom.unauthorized('Invalid username'));
  }

  // update password and username activation token
  try {
    password_hash = await bcrypt.hash(password, 10);
  } catch(e) {
    console.error(e);
    console.error('Unable to generate password hash');
    return next(Boom.badImplementation('Unable to generate password hash'));
  }

  query = `
  mutation  (
    $username: String!,
    $password_hash: String!,
    $new_secret_token: uuid!
  ) {
    update_${schema_name}users (
      where: {
        username: { _eq: $username }
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
    await graphql_client.request(query, {
      username,
      password_hash,
      new_secret_token: uuidv4(),
    });
  } catch (e) {
    console.error(e);
    console.log('Unable to update password on GraphQL request');
    return next(Boom.unauthorized('Unable to update password'));
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
    console.error('Error connection to GraphQL');
    console.error(e);
    return next(Boom.unauthorized('Invalid username or password'));
  }

  if (hasura_data[`${schema_name}users`].length === 0) {
    console.error('No user with that username');
    return next(Boom.unauthorized('Invalid username or password'));
  }

  // check if we got any user back
  const user = hasura_data[`${schema_name}users`][0];

  if (!user.active) {
    console.error('User not activated');
    return next(Boom.unauthorized('User not activated'));
  }

  // see if password hashes matches
  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    console.error('Password does not match');
    return next(Boom.unauthorized('Invalid username or password'));
  }
  console.warn('user: ' + JSON.stringify(user, null, 2));

  const jwt_token = auth_tools.generateJwtToken(user);

  // generate refetch token and put in database
  query = `
  mutation (
    $refetch_token_data: refetch_tokens_insert_input!
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
    return next(Boom.badImplementation('Could not update refetch token for user'));
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
    console.error('Error connection to GraphQL');
    console.error(e);
    return next(Boom.unauthorized('Invalid refetch_token or user_id'));
  }

  if (hasura_data[`${schema_name}refetch_tokens`].length === 0) {
    console.error('Incorrect user id or refetch token');
    return next(Boom.unauthorized('Invalid refetch_token or user_id'));
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
    console.error('unable to create new refetch token and delete old');
    console.log(e);
    return next(Boom.unauthorized('Invalid refetch_token or user_id'));
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
