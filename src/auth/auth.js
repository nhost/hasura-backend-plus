const express = require('express');
const Joi = require('joi');
const Boom = require('boom');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const uuidv4 = require('uuid/v4');
const { graphql_client } = require('../graphql-client');

const {
  USER_FIELDS,
  REFETCH_TOKEN_EXPIRES,
  USER_REGISTRATION_AUTO_ACTIVE,
  USER_MANAGEMENT_DATABASE_SCHEMA_NAME
} = require('../config');

const auth_tools = require('./auth-tools');

var router = express.Router();

const schema_name = USER_MANAGEMENT_DATABASE_SCHEMA_NAME === "public" ? "" :  USER_MANAGEMENT_DATABASE_SCHEMA_NAME.toString().toLowerCase() + "_";

router.post('/register', async (req, res, next) => {

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
  var query = `
  query get_user($username: String!) {
    ${schema_name}user (
      where: {
        username: { _eq: $username }
      }
    ) {
      id
    }
  }
  `;

  try {
    var hasura_data = await graphql_client.request(query, {
      username,
    });
  } catch (e) {
    console.log(e);
    return next(Boom.badImplementation('Unable to check for duplicates'));
  }

  if (hasura_data[`${schema_name}user`].length !== 0) {
    return next(Boom.unauthorized('The username is already in use'));
  }

  // generate password_hash
  try {
    var password_hash = await bcrypt.hash(password, 10);
  } catch(e) {
    return next(Boom.badImplementation('Unable to generate password hash'));
  }

  // insert user
  var query = `
  mutation insert_user($user: ${schema_name}user_insert_input!) {
    insert_${schema_name}user(
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
        activation_token: uuidv4(),
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

  const schema = Joi.object().keys({
    username: Joi.string().required(),
    activation_token: Joi.string().uuid({version: ['uuidv4']}).required(),
  });

  const { error, value } = schema.validate(req.query);

  if (error) {
    return next(Boom.badRequest(error.details[0].message));
  }

  const {
    username,
    activation_token,
  } = value;

  var query = `
  mutation activate_account (
    $username: String!,
    $activation_token: uuid!
    $new_activation_token: uuid!
  ) {
    update_${schema_name}user (
      where: {
        _and: [
          {
            username: { _eq: $username}
          },{
            activation_token: { _eq: $activation_token}
          },{
            active: { _eq: false}
          },
        ]
      }
      _set: {
        active: true,
        activation_token: $new_activation_token,
      }
    ) {
      affected_rows
    }
  }
  `;

  try {
    var hasura_data = await graphql_client.request(query, {
      username,
      activation_token,
      new_activation_token: uuidv4(),
    });
  } catch (e) {
    console.error(e);
    return next(Boom.unauthorized('Account is already activated, there is no account or unable to activate account'));
  }

  if (hasura_data[`update_${schema_name}user`].affected_rows === 0) {
    console.error('Account already activated');
    return next(Boom.unauthorized('Account is already activated, there is no account or unable to activate account'));
  }

  res.send('OK');
});

router.post('/new-password', async (req, res, next) => {

  const schema = Joi.object().keys({
    username: Joi.string().required(),
    activation_token: Joi.string().uuid({version: ['uuidv4']}).required(),
    password: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return next(Boom.badRequest(error.details[0].message));
  }

  const {
    username,
    activation_token,
    password,
  } = value;

  // check username and ActivationToken
  // check for duplicates
  var query = `
  query check_username_and_token(
    $username: String!,
    $activation_token: uuid!
  ) {
    users (
      where: {
        _and: [{
          username: { _eq: $username}
        },{
          activation_token: { _eq: $activation_token}
        }]
      }
    ) {
      id
    }
  }
  `;

  try {
    var hasura_data = await graphql_client.request(query, {
      username,
      activation_token,
    });
  } catch (e) {
    console.error(e);
    console.error('activation token not valid');
    return next(Boom.unauthorized('activation_token not valid'));
  }

  // update password and username activation token
  try {
    var password_hash = await bcrypt.hash(password, 10);
  } catch(e) {
    console.error(e);
    console.error('Unable to generate password hash');
    return next(Boom.badImplementation('Unable to generate password hash'));
  }

  var query = `
  mutation update_user_password (
    $username: String!,
    $password_hash: String!,
    $activation_token: uuid!
  ) {
    update_users (
      where: {
        username: { _eq: $username }
      }
      _set: {
        password_hash: $password_hash,
        activation_token: $activation_token
      }
    ) {
      affected_rows
    }
  }
  `;

  try {
    var hasura_data = await graphql_client.request(query, {
      username,
      password_hash,
      activation_token: uuidv4(),
    });
  } catch (e) {
    console.error(e);
    console.log('unable to update password on GraphQL request');
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
  query get_user($username: String!) {
    ${schema_name}user (
      where: {
      _and: [
          {
            username: { _eq: $username}
          },{
            active: { _eq: true}
          },
        ]
      }
    ) {
      id
      password
      role: userRolesByuserId {
        roleByroleId {
          name
        }
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

  if (hasura_data[`${schema_name}user`].length === 0) {
    console.error('No user with that username');
    return next(Boom.unauthorized('Invalid username or password'));
  }

  // check if we got any user back
  const user = hasura_data[`${schema_name}user`][0];

  // see if password hashes matches
  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    console.error('Password does not match');
    return next(Boom.unauthorized('Invalid username or password'));
  }
  console.warn("user: " + JSON.stringify(user, null, 2));

  const jwt_token = auth_tools.generateJwtToken(user);

  // generate refetch token and put in database
  query = `
  mutation insert_refetch_token($user_id: Int!, $token: uuid!) {
    insert_${schema_name}refetch_token (
      objects: [{
        token: $token,
        user_id: $user_id,
      }]
    ) {
      affected_rows
    }
  }
  `;

  const refetch_token = uuidv4();
  try {
    hasura_data = await graphql_client.request(query, {
      user_id: user.id,
      token: refetch_token,
    });
  } catch (e) {
    console.error(e);
    return next(Boom.badImplementation('Could not update refetch token for user'));
  }

  res.cookie('jwt_token', jwt_token, {
    expires: new Date(Date.now() + (REFETCH_TOKEN_EXPIRES * 60 * 1000)),
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
    user_id: Joi.string().required(),
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
    $min_created_at: timestamptz!,
  ) {
    ${schema_name}refetch_token (
      where: {
        _and: [{
          token: { _eq: $refetch_token }
        }, {
          user_id: { _eq: $user_id }
        }, {
          created_at: { _gte: $min_created_at }
        }]
      }
    ) {
      userByuserId {
        id
        role: userRolesByuserId {
          roleByroleId {
            name
          }
        }
        ${USER_FIELDS.join('\n')}
      }
    }
  }
  `;

  let hasura_data;
  try {
    const used_vars = {
    };
    hasura_data = await graphql_client.request(query, {
      refetch_token,
      user_id,
      min_created_at: new Date(new Date().getTime() - (REFETCH_TOKEN_EXPIRES * 60 * 1000)),
    });
  } catch (e) {
    console.error('Error connection to GraphQL');
    console.error(e);
    return next(Boom.unauthorized('Invalid refetch_token or user_id'));
  }

  if (hasura_data[`${schema_name}refetch_token`].length === 0) {
    console.error('Incorrect user id or refetch token');
    return next(Boom.unauthorized('Invalid refetch_token or user_id'));
  }

  const user = hasura_data[`${schema_name}refetch_token`][0].userByuserId;

  // delete current refetch token and generate a new, and insert the
  // new refetch_token in the database
  // two mutations as transaction
  query = `
  mutation new_refetch_token(
    $old_refetch_token: uuid!,
    $new_refetch_token: uuid!,
    $user_id: Int!
  ) {
    delete_${schema_name}refetch_token (
      where: {
        _and: [{
          token: { _eq: $old_refetch_token }
        }, {
          user_id: { _eq: $user_id }
        }]
      }
    ) {
      affected_rows
    }
    insert_${schema_name}refetch_token (
      objects: [{
        token: $new_refetch_token,
        user_id: $user_id,
      }]
    ) {
      affected_rows
    }
  }
  `;

  const new_refetch_token = uuidv4();
  try {
    hasura_data = await graphql_client.request(query, {
      old_refetch_token: refetch_token,
      new_refetch_token: new_refetch_token,
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
    expires: new Date(Date.now() + (REFETCH_TOKEN_EXPIRES*60*1000)),
    httpOnly: true,
  });

  res.json({
    jwt_token,
    refetch_token: new_refetch_token,
    user_id,
  });
});

module.exports = router;
