// HASURA
exports.HASURA_GRAPHQL_ENDPOINT = process.env.HASURA_GRAPHQL_ENDPOINT || 'http://graphql-engine:8080/v1/graphql';
exports.HASURA_GRAPHQL_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET || '';
exports.HASURA_GRAPHQL_JWT_SECRET = process.env.HASURA_GRAPHQL_JWT_SECRET ? JSON.parse(process.env.HASURA_GRAPHQL_JWT_SECRET) : {'type':'HS256', 'key': 'hasura_secretkey'};

// AUTH
exports.AUTH_ACTIVE = process.env.AUTH_ACTIVE ? process.env.AUTH_ACTIVE === 'true' : true;
exports.ANONYMOUS_USERS_ACTIVE = process.env.ANONYMOUS_USERS_ACTIVE ? process.env.ANONYMOUS_USERS_ACTIVE === 'true' : false;
exports.USER_MANAGEMENT_DATABASE_SCHEMA_NAME = process.env.USER_MANAGEMENT_DATABASE_SCHEMA_NAME || 'public';
exports.USER_FIELDS = process.env.USER_FIELDS ? process.env.USER_FIELDS.split(',') : [];
exports.USER_REGISTRATION_AUTO_ACTIVE = process.env.USER_REGISTRATION_AUTO_ACTIVE ? process.env.USER_REGISTRATION_AUTO_ACTIVE === 'true' : false;
exports.JWT_TOKEN_EXPIRES = process.env.JWT_TOKEN_EXPIRES || 15; // expire after 15 minutes
exports.REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || (60*24*30); // expire after 30 days

// AUTH LOCAL
exports.AUTH_LOCAL_ACTIVE = process.env.AUTH_LOCAL_ACTIVE ? process.env.AUTH_LOCAL_ACTIVE === 'true' : false;

// PROVIDERS
exports.PROVIDERS_SUCCESS_REDIRECT = process.env.PROVIDERS_SUCCESS_REDIRECT || '';
exports.PROVIDERS_FAILURE_REDIRECT = process.env.PROVIDERS_FAILURE_REDIRECT || '';

// GITHUB
exports.AUTH_GITHUB_ACTIVE = process.env.AUTH_GITHUB_ACTIVE ? process.env.AUTH_GITHUB_ACTIVE === 'true' : false;
exports.AUTH_GITHUB_CLIENT_ID = process.env.AUTH_GITHUB_CLIENT_ID || '';
exports.AUTH_GITHUB_CLIENT_SECRET = process.env.AUTH_GITHUB_CLIENT_SECRET || '';
exports.AUTH_GITHUB_CALLBACK_URL = process.env.AUTH_GITHUB_CALLBACK_URL || '';
exports.AUTH_GITHUB_AUTHORIZATION_URL = process.env.AUTH_GITHUB_AUTHORIZATION_URL || null;
exports.AUTH_GITHUB_TOKEN_URL = process.env.AUTH_GITHUB_TOKEN_URL || null;
exports.AUTH_GITHUB_USER_PROFILE_URL = process.env.AUTH_GITHUB_USER_PROFILE_URL || null;

// GOOGLE
exports.AUTH_GOOGLE_ACTIVE = process.env.AUTH_GOOGLE_ACTIVE ? process.env.AUTH_GOOGLE_ACTIVE === 'true' : false;
exports.AUTH_GOOGLE_CLIENT_ID = process.env.AUTH_GOOGLE_CLIENT_ID || '';
exports.AUTH_GOOGLE_CLIENT_SECRET = process.env.AUTH_GOOGLE_CLIENT_SECRET || '';
exports.AUTH_GOOGLE_CALLBACK_URL = process.env.AUTH_GOOGLE_CALLBACK_URL || '';

// FACEBOOK
exports.AUTH_FACEBOOK_ACTIVE = process.env.AUTH_FACEBOOK_ACTIVE ? process.env.AUTH_FACEBOOK_ACTIVE === 'true' : false;
exports.AUTH_FACEBOOK_CLIENT_ID = process.env.AUTH_FACEBOOK_CLIENT_ID || '';
exports.AUTH_FACEBOOK_CLIENT_SECRET = process.env.AUTH_FACEBOOK_CLIENT_SECRET || '';
exports.AUTH_FACEBOOK_CALLBACK_URL = process.env.AUTH_FACEBOOK_CALLBACK_URL || '';

// STORAGE
exports.STORAGE_ACTIVE = process.env.STORAGE_ACTIVE ? process.env.STORAGE_ACTIVE === 'true' : true;
exports.STORAGE_JWT_SECRET = process.env.STORAGE_JWT_SECRET ? JSON.parse(process.env.STORAGE_JWT_SECRET) : {'type':'HS256', 'key': 'storage_secretkey'};
exports.S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || '';
exports.S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || '';
exports.S3_ENDPOINT = process.env.S3_ENDPOINT || '';
exports.S3_BUCKET = process.env.S3_BUCKET || '';
