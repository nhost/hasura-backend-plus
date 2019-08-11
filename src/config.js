exports.AUTH_ACTIVE = process.env.AUTH_ACTIVE ? process.env.AUTH_ACTIVE === 'true' : true;
exports.STORAGE_ACTIVE = process.env.STORAGE_ACTIVE ? process.env.STORAGE_ACTIVE === 'true' : true;
exports.USER_FIELDS = process.env.USER_FIELDS ? process.env.USER_FIELDS.split(',') : [];
exports.USER_MANAGEMENT_DATABASE_SCHEMA_NAME = process.env.USER_MANAGEMENT_DATABASE_SCHEMA_NAME || 'public';
exports.USER_REGISTRATION_AUTO_ACTIVE = process.env.USER_REGISTRATION_AUTO_ACTIVE ? process.env.USER_REGISTRATION_AUTO_ACTIVE === 'true' : false;
exports.HASURA_GRAPHQL_ENDPOINT = process.env.HASURA_GRAPHQL_ENDPOINT || 'http://graphql-engine:8080/v1/graphql';
exports.HASURA_GRAPHQL_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET || '';
exports.HASURA_GRAPHQL_JWT_SECRET = process.env.HASURA_GRAPHQL_JWT_SECRET ? JSON.parse(process.env.HASURA_GRAPHQL_JWT_SECRET) : {'type':'HS256', 'key': 'secretkey'};
exports.S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || '';
exports.S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || '';
exports.S3_ENDPOINT = process.env.S3_ENDPOINT || '';
exports.S3_BUCKET = process.env.S3_BUCKET || '';
exports.REFETCH_TOKEN_EXPIRES = process.env.REFETCH_TOKEN_EXPIRES || (60*24*30); // expire after 30 days
exports.JWT_TOKEN_EXPIRES = process.env.JWT_TOKEN_EXPIRES || 15; // expire after 15 minutes
