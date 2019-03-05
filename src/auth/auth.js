const express = require('express');
const Joi = require('joi');
const Boom = require('boom');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const uuidv4 = require('uuid/v4');
const { graphql_client } = require('../graphql-client');

const {
  DOMAIN,
  USER_FIELDS,
  REFETCH_TOKEN_EXPIRES,
  USER_REGISTRATION_AUTO_ACTIVE,
} = require('../config');

const auth_tools = require('./auth-tools');

var router = express.Router();

router.post('/register', async (req, res, next) => {

  const schema = Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return next(Boom.badRequest(error.details[0].message));
  }

  const { email, password } = value;

  // check for duplicates
  var query = `
  query get_user($email: String!) {
    users (
      where: {
        email: { _eq: $email }
      }
    ) {
      id
    }
  }
  `;

  try {
    var hasura_data = await graphql_client.request(query, {
      email,
    });
  } catch (e) {
    return next(Boom.badImplementation('Unable to check for duplicates'));
  }

  if (hasura_data.users.length !== 0) {
    return next(Boom.unauthorized('The email is already in use'));
  }

  // generate password_hash
  try {
    var password_hash = await bcrypt.hash(password, 10);
  } catch(e) {
    return next(Boom.badImplementation('Unable to generate password hash'));
  }

  // insert user
  var query = `
  mutation insert_user($user: users_insert_input!) {
    insert_users(
      objects: [$user]
    ) {
      affected_rows
    }
  }
  `;

  try {
    await graphql_client.request(query, {
      user: {
        email,
        password_hash,
        email_token: uuidv4(),
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
    email: Joi.string().email().required(),
    email_token: Joi.string().uuid({version: ['uuidv4']}).required(),
  });

  const { error, value } = schema.validate(req.query);

  if (error) {
    return next(Boom.badRequest(error.details[0].message));
  }

  const {
    email,
    email_token,
  } = value;

  var query = `
  mutation activate_account (
    $email: String!,
    $email_token: uuid!
    $new_email_token: uuid!
  ) {
    update_users (
      where: {
        _and: [
          {
            email: { _eq: $email}
          },{
            email_token: { _eq: $email_token}
          },{
            active: { _eq: false}
          },
        ]
      }
      _set: {
        active: true,
        email_token: $new_email_token,
      }
    ) {
      affected_rows
    }
  }
  `;

  try {
    var hasura_data = await graphql_client.request(query, {
      email,
      email_token,
      new_email_token: uuidv4(),
    });
  } catch (e) {
    console.error(e);
    return next(Boom.unauthorized('Account is already activated, there is no account or unable to activate account'));
  }

  if (hasura_data.update_users.affected_rows === 0) {
    console.error('Account already activated');
    return next(Boom.unauthorized('Account is already activated, there is no account or unable to activate account'));
  }

  res.send('OK');
});

router.post('/new-password', async (req, res, next) => {

  const schema = Joi.object().keys({
    email: Joi.string().email().required(),
    email_token: Joi.string().uuid({version: ['uuidv4']}).required(),
    password: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return next(Boom.badRequest(error.details[0].message));
  }

  const {
    email,
    email_token,
    password,
  } = value;

  // check email and emailActivationToken
  // check for duplicates
  var query = `
  query check_email_and_token(
    $email: String!,
    $email_token: uuid!
  ) {
    users (
      where: {
        _and: [{
          email: { _eq: $email}
        },{
          email_token: { _eq: $email_token}
        }]
      }
    ) {
      id
    }
  }
  `;

  try {
    var hasura_data = await graphql_client.request(query, {
      email,
      email_token,
    });
  } catch (e) {
    console.error(e);
    console.error('email token not valid');
    return next(Boom.unauthorized('email_token not valid'));
  }

  // update password and email activation token
  try {
    var password_hash = await bcrypt.hash(password, 10);
  } catch(e) {
    console.error(e);
    console.error('Unable to generate password hash');
    return next(Boom.badImplementation('Unable to generate password hash'));
  }

  var query = `
  mutation update_user_password (
    $email: String!,
    $password_hash: String!,
    $email_token: uuid!
  ) {
    update_users (
      where: {
        email: { _eq: $email }
      }
      _set: {
        password_hash: $password_hash,
        email_token: $email_token
      }
    ) {
      affected_rows
    }
  }
  `;

  try {
    var hasura_data = await graphql_client.request(query, {
      email,
      password_hash,
      email_token: uuidv4(),
    });
  } catch (e) {
    console.error(e);
    console.log('unable to update password on GraphQL request');
    return next(Boom.unauthorized('Unable to update password'));
  }

  // return 200 OK
  res.send('OK');
});

router.post('/sign-in', async (req, res, next) => {

  // validate email and password
  const schema = Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return next(Boom.badRequest(error.details[0].message));
  }

  const { email, password } = value;

  let query = `
  query get_user($email: String!) {
    users (
      where: {
        email: { _eq: $email }
      }
    ) {
      id
      password_hash
      role
      ${USER_FIELDS.join('\n')}
    }
  }
  `;

  let hasura_data;
  try {
    hasura_data = await graphql_client.request(query, {
      email,
    });
  } catch (e) {
    console.error('Error connection to GraphQL');
    console.error(e);
    return next(Boom.unauthorized('Invalid email or password'));
  }

  if (hasura_data.users.length === 0) {
    console.error('No user with that email');
    console.error(e);
    return next(Boom.unauthorized('Invalid email or password'));
  }

  // check if we got any user back
  const user = hasura_data.users[0];

  // see if password hashes matches
  const match = await bcrypt.compare(password, user.password_hash);

  if (!match) {
    console.error('Password does not match');
    return next(Boom.unauthorized('Invalid email or password'));
  }

  const jwt_token = auth_tools.generateJwtToken(user);

  // generate refetch token and put in database
  query = `
  mutation insert_refetch_token($user_id: Int!, $refetch_token: uuid!) {
    insert_refetch_tokens (
      objects: [{
        refetch_token: $refetch_token,
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
      refetch_token,
    });
  } catch (e) {
    console.error(e);
    return next(Boom.badImplementation('Could not update refetch token for user'));
  }

  res.cookie('jwt_token', jwt_token, {
    domain: DOMAIN,
    expires: new Date(Date.now() + (15*60*1000)),
  });


  // return jwt token and refetch token to client
  res.json({
    jwt_token,
    refetch_token,
    user_id: user.id,
  });
});

router.post('/refetch-token', async (req, res, next) => {

  // validate email and password
  const schema = Joi.object().keys({
    user_id: Joi.number().required(),
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
    $min_added_at: timestamptz!,
  ) {
    refetch_tokens (
      where: {
        _and: [{
          refetch_token: { _eq: $refetch_token }
        }, {
          user_id: { _eq: $user_id }
        }, {
          added_at: { _gte: $min_added_at }
        }]
      }
    ) {
      usersByuserId {
        id
        role
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
      min_added_at: new Date(new Date().getTime() - (REFETCH_TOKEN_EXPIRES * 1000)),
    });
  } catch (e) {
    console.error('Error connection to GraphQL');
    console.error(e);
    return next(Boom.unauthorized('Invalid refetch_token or user_id'));
  }

  if (hasura_data.refetch_tokens.length === 0) {
    console.error('Incorrect user id or refetch token');
    return next(Boom.unauthorized('Invalid refetch_token or user_id'));
  }

  const user = hasura_data.refetch_tokens[0].usersByuserId;

  // delete current refetch token and generate a new, and insert the
  // new refetch_token in the database
  // two mutations as transaction
  query = `
  mutation new_refetch_token(
    $old_refetch_token: uuid!,
    $new_refetch_token: uuid!,
    $user_id: Int!
  ) {
    delete_refetch_tokens (
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
    insert_refetch_tokens (
      objects: [{
        refetch_token: $new_refetch_token,
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
    domain: DOMAIN,
    expires: new Date(Date.now() + (15*60*1000)),
  });

  res.json({
    jwt_token,
    refetch_token: new_refetch_token,
    user_id,
  });
});

module.exports = router;
