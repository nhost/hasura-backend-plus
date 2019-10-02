// HASURA
exports.HASURA_GRAPHQL_ENDPOINT = process.env.HASURA_GRAPHQL_ENDPOINT || 'http://graphql-engine:8080/v1/graphql';
exports.HASURA_GRAPHQL_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET || '';
exports.HASURA_GRAPHQL_JWT_SECRET = process.env.HASURA_GRAPHQL_JWT_SECRET ? JSON.parse(process.env.HASURA_GRAPHQL_JWT_SECRET) : {'type':'HS256', 'key': 'hasura_secretkey'};

// AUTH
exports.REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || (60*24*30); // expire after 30 days
exports.JWT_TOKEN_EXPIRES = process.env.JWT_TOKEN_EXPIRES || 15; // expire after 15 minutes
exports.AUTH_ACTIVE = process.env.AUTH_ACTIVE ? process.env.AUTH_ACTIVE === 'true' : true;
exports.USER_MANAGEMENT_DATABASE_SCHEMA_NAME = process.env.USER_MANAGEMENT_DATABASE_SCHEMA_NAME || 'public';
exports.USER_FIELDS = process.env.USER_FIELDS ? process.env.USER_FIELDS.split(',') : [];
exports.USER_REGISTRATION_AUTO_ACTIVE = process.env.USER_REGISTRATION_AUTO_ACTIVE ? process.env.USER_REGISTRATION_AUTO_ACTIVE === 'true' : false;

// AUTH LOCAL
exports.AUTH_LOCAL_ACTIVE = process.env.AUTH_LOCAL_ACTIVE ? process.env.AUTH_LOCAL_ACTIVE === 'true' : false;

// GITHUB
exports.AUTH_GITHUB_ACTIVE = process.env.AUTH_GITHUB_ACTIVE ? process.env.AUTH_GITHUB_ACTIVE === 'true' : false;
exports.GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || null;
exports.GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || null;
exports.GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || null;

// STORAGE
exports.STORAGE_ACTIVE = process.env.STORAGE_ACTIVE ? process.env.STORAGE_ACTIVE === 'true' : true;
exports.STORAGE_JWT_SECRET = process.env.STORAGE_JWT_SECRET ? JSON.parse(process.env.STORAGE_JWT_SECRET) : {'type':'HS256', 'key': 'storage_secretkey'};
exports.S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || '';
exports.S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || '';
exports.S3_ENDPOINT = process.env.S3_ENDPOINT || '';
exports.S3_BUCKET = process.env.S3_BUCKET || '';
