const jwt = require('jsonwebtoken');
const { JWT_SECRET, USER_FIELDS  } = require('./config');

module.exports = {
	generateJwtToken: function(user) {

		let custom_claims = {};

		USER_FIELDS.forEach(user_field => {
			custom_claims['x-hasura-' + user_field.replace('_', '-')] = user[user_field].toString();
		});

		return jwt.sign({
			'https://hasura.io/jwt/claims': {
				'x-hasura-allowed-roles': [user.role],
				'x-hasura-default-role': user.role,
				'x-hasura-user-id': user.id.toString(),
				...custom_claims,
			},
		}, JWT_SECRET, {
			expiresIn: '15m',
		});
	},
};
