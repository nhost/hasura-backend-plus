const jwt = require('jsonwebtoken');
const {
  REFETCH_TOKEN_EXPIRES,
  HASURA_GQE_JWT_SECRET,
  USER_FIELDS,
} = require('../config');

module.exports = {
	generateJwtToken: function(user) {

		let custom_claims = {};

		USER_FIELDS.forEach(user_field => {
			custom_claims['x-hasura-' + user_field.replace('_', '-')] = user[user_field].toString();
		});

		return jwt.sign({
			'https://hasura.io/jwt/claims': {
				'x-hasura-allowed-roles': [user.roles],
				'x-hasura-default-role': user.default_role,
				'x-hasura-user-id': user.id.toString(),
				...custom_claims,
			},
		}, HASURA_GQE_JWT_SECRET.key, {
			algorithm: HASURA_GQE_JWT_SECRET.type,
			expiresIn: `${REFETCH_TOKEN_EXPIRES}m`,
		});
	},
};
