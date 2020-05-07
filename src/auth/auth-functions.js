const jwt = require('jsonwebtoken');
const {
  JWT_TOKEN_EXPIRES,
  HASURA_GRAPHQL_JWT_SECRET,
  STORAGE_JWT_SECRET,
  USER_FIELDS,
} = require('../config');

module.exports = {
  generateJwtToken: function(user) {

    const custom_claims = {};

    USER_FIELDS.forEach(user_field => {

      if (typeof user[user_field] === 'undefined' || user[user_field] === null) {
        return null;
      }

      custom_claims['x-hasura-' + user_field.replace('_', '-')] = user[user_field].toString();
    });

    const user_roles = user.user_roles.map(role => {
      return role.role;
    });

    if (!user_roles.includes(user.default_role)) {
      user_roles.push(user.default_role);
    }

    const claims_namespace = ("claims_namespace" in HASURA_GRAPHQL_JWT_SECRET) 
      ? HASURA_GRAPHQL_JWT_SECRET.claims_namespace 
        : 'https://hasura.io/jwt/claims';
    
    const claims = {};
    claims[claims_namespace] = {
      'x-hasura-allowed-roles': user_roles,
      'x-hasura-default-role': user.default_role,
      'x-hasura-user-id': user.id.toString(),
      'x-hasura-is-anonymous': user.is_anonymous.toString(),
      ...custom_claims,
    }

    return jwt.sign(claims, HASURA_GRAPHQL_JWT_SECRET.key, {
      algorithm: HASURA_GRAPHQL_JWT_SECRET.type,
      expiresIn: `${JWT_TOKEN_EXPIRES}m`,
    });
  },
};
