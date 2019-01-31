module.exports = {

	// key - file path
	// type - [ read, write ]
	// claims - claims in JWT
	// this is similar to Firebase Security Rules for files. but not as good looking
	validateInteraction: function(key, type, claims) {
		let res;

		// console.log({key});
		// console.log({type});
		// console.log({claims});

		res = key.match(/\/companies\/(?<company_id>\w*)\/customers\/(\d*)\/.*/);
		if (res) {
			if (claims['x-hasura-company-id'] === res.groups.company_id) {
				return true;
			}
			return false;
		}

		// accept read to public directory
		res = key.match(/\/public\/.*/);
		if (res) {
			if (type === 'read') {
				return true;
			}
		}

		return false;
	},
};
