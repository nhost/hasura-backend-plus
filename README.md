<p align="center">
  <a href="https://github.com/elitan/hasura-backend-plus">
    <img src="https://github.com/elitan/hasura-backend-plus/raw/master/logo.png" width="250px" alt="HBP" />
  </a>
</p>


<h3 align="center">Hasura Backend Plus ( HBP )</h3>
<h4 align="center">Auth & Files (S3-compatible Object Storage) for Hasura</h4>

---

# Nhost

The easiest way to deploy HBP is with our official [Nhost](https://nhost.io) managed service. Get your perfect configured backend with PostgreSQL, Hasura and Hasura Backend Plus and save your self hours of maintenance per month.

All [Nhost](https://nhost.io) projects contains all open source software to build realtime web and mobile apps fast 🚀.

[https://nhost.io](https://nhost.io)

---

# Setup

## Get your database ready

Create tables and initial state for your user mangagement by copy everything from the file `db-init.sql` and insert into the SQL tab in the Hasura Console.

## Track your tables and relations in Hasura

Go to the Hasura console. Click the "Data" menu link and then click "Track all" under both "Untracked tables or views" and "Untracked foreign-key relations"

## Create minimal storage rules

In the same directory where you have your `docker-compose.yaml` for your Hasura and HB+ project. Do the following:

```
mkdir storage-rules
vim storage-rules/index.js
```

Add this:
```
module.exports = {

  // key - file path
  // type - [ read, write ]
  // claims - claims in JWT
  // this is similar to Firebase Storage Security Rules.

  storagePermission: function(key, type, claims) {
    // UNSECURE! Allow read/write all files. Good to get started tho
    return true;
  },
};

```


## Deploy

Add to `docker-compose.yaml`:

```
hasura-backend-plus:
  image: elitan/hasura-backend-plus:latest
  environment:
    PORT: 3000
    AUTH_ACTIVE: 'true'
    AUTH_LOCAL_ACTIVE: 'true'
    USER_FIELDS: ''
    USER_REGISTRATION_AUTO_ACTIVE: 'true'
    HASURA_GRAPHQL_ENDPOINT: http://graphql-engine:8080/v1/graphql
    HASURA_GRAPHQL_ADMIN_SECRET: <hasura-admin-secret>
    HASURA_GRAPHQL_JWT_SECRET: '{"type": "HS256", "key": "a_pretty_long_secret_key"}'
    S3_ACCESS_KEY_ID: <access>
    S3_SECRET_ACCESS_KEY: <secret>
    S3_ENDPOINT: <endpoint>
    S3_BUCKET: <bucket>
    REFRESH_TOKEN_EXPIRES: 43200
    JWT_TOKEN_EXPIRES: 15
  volumes:
  - ./storage-rules:/app/src/storage/rules

caddy:
  ....
  depends_on:
  - graphql-engine
  - hasura-backend-plus
```

Add this to your caddy file

```
hasura.myapp.io {
  proxy / graphql-engine:8080 {
    websocket
    transparent
  }
}

backend.myapp.io {
  proxy / hasura-backend-plus:3000 {
    transparent
  }
}
```

Restart your docker containers

`docker-compose up -d`

## Configuration

### ENV VARIABLES:
| name | default | description |
| :---         |     :---      |          :--- |
| `PORT`   | `4000`     | Express server port |
| `AUTH_ACTIVE`   | `true`     | Activate authentication    |
| `USER_MANAGEMENT_DATABASE_SCHEMA_NAME`   | `` | Database schema name of where the `users` table is located |
| `USER_FIELDS`   | ``     | Specify user table fields that should be available as `x-hasura-` JWT claims.  |
| `USER_REGISTRATION_AUTO_ACTIVE`   | `false`   | Weather new user account should automatically be activated. Account that are not active are unable to log in.  |
| `JWT_TOKEN_EXPIRES`   | `15` | Minutes until JWT token expires |
| `REFRESH_TOKEN_EXPIRES`   | `43200` (30 days)  | Minutes until refresh token expires |
| `AUTH_LOCAL_ACTIVE`   | `false`     | Activate authentication for local accounts    |
| `PROVIDERS_SUCCESS_REDIRECT`   | ``     | The URL the user should be redirected to on successful signin/signup with a OAuth provider.   |
| `PROVIDERS_FAILURE_REDIRECT`   | ``     | The URL the user should be redirected to on failed signin/signup with a OAuth provider.   |
| `AUTH_GITHUB_ACTIVE`   | `false`     | Activate Github as an OAuth provider.   |
| `AUTH_GITHUB_CLIENT_ID`   | ``     | Github OAuth app Client ID.   |
| `AUTH_GITHUB_CLIENT_SECRET`   | ``     | Github OAuth app Client Secret.   |
| `AUTH_GITHUB_CALLBACK_URL`   | ``     | Github OAuth app authorization callback URL.   |
| `AUTH_GOOGLE_ACTIVE`   | `false`     | Activate Google as an OAuth provider.   |
| `AUTH_GOOGLE_CLIENT_ID`   | ``     | Google OAuth app Client ID.   |
| `AUTH_GOOGLE_CLIENT_SECRET`   | ``     | Google OAuth app Client Secret.   |
| `AUTH_GOOGLE_CALLBACK_URL`   | ``     | Google OAuth app authorization callback URL.   |
| `AUTH_FACEBOOK_ACTIVE`   | `false`     | Activate Facebook as an OAuth provider.   |
| `AUTH_FACEBOOK_CLIENT_ID`   | ``     | Facebook OAuth app Client ID.   |
| `AUTH_FACEBOOK_CLIENT_SECRET`   | ``     | Facebook OAuth app Client Secret.   |
| `AUTH_FACEBOOK_CALLBACK_URL`   | ``     | Facebook OAuth app authorization callback URL.   |
| `STORAGE_ACTIVE`   | `true`     | Activate storage   |
| `HASURA_GRAPHQL_ENDPOINT`   | `http://graphql-engine:8080/v1/graphql`     | Hasura GraphQL endpoint  |
| `HASURA_GRAPHQL_ADMIN_SECRET`   | ``  | Hasura GraphQL admin secret |
| `HASURA_GRAPHQL_JWT_SECRET`   | `{ 'type' : 'HS256', 'key': 'secretkey' }`  | Shared JWT secret. Must be same as Hasuras `HASURA_GRAPHQL_JWT_SECRET` |
| `S3_ACCESS_KEY_ID`   | ``  | S3 access key id |
| `S3_SECRET_ACCESS_KEY`   | ``  | S3 secret access key |
| `S3_ENDPOINT`   | ``  | S3 endpoint |
| `S3_BUCKET`   | ``  | S3 bucket name |


#### USER_FIELDS

If you have some specific fields on your users that you also want to have as a JWT claim you can specify those user fields in the `USER_FIELDS` env var.

So lets say you have a user table like:

* id
* email
* password
* role
* **company_id**

and you want to include the `company_id` as a JWT claim. You can specify `USER_FIELDS=company_id`.

Then you will have a JWT a little something like this:

```
{
  "https://hasura.io/jwt/claims": {
    "x-hasura-allowed-roles": [
      "user"
      "company_admin"
    ],
    "x-hasura-default-role": "company_admin",
    "x-hasura-user-id": "3",
    "x-hasura-company-id": "1" <------ THERE WE GO :)
  },
  "iat": 1549526843,
  "exp": 1549527743
}
```
This enables you to make permissions using `x-hasura-company-id` for insert/select/update/delete in on tables in your Hasura console. Like this: `{"seller_company_id":{"_eq":"X-HASURA-COMPANY-ID"}}`

It also enables you to write permission rules for the storage endpoint in this repo. Here is an example:
https://github.com/elitan/hasura-backend-plus/blob/master/src/storage/storage-tools.js#L16

# HASURA_GRAPHQL_ENDPOINT

## Auth
```
/auth/refresh-token
/auth/activate-account
/auth/users
```

### Refresh Token

`/auth/refresh-token`

Returns a JWT token.

### activate Account

`/auth/local/activate-account`

| variable | type | required |
| :---         |     :---      | :--- |
| `secret_token`   | `uuid`     | YES |

### Refresh Token

`/auth/user`

Returns the full User object

## Auth Local

```
/auth/local/register
/auth/local/login
/auth/local/new-password
```

Use HTTP POST method.

### Register

`/auth/local/register`

| variable | type | required | comment |
| :---         |     :---      | :--- |
| `email`   | `string`     | YES | |
| `username`   | `string`     | YES | can be same as email |
| `password`   | `string`     | YES | |
| `register_data`   | `json object`     | NO | |

### Login

`/auth/local/login`

| variable | type | required |
| :---         |     :---      | :--- |
| `username`   | `string`     | YES |
| `password`   | `string`     | YES |

### New password

`/auth/local/new-password`

`POST`

| variable | type | required |
| :---         |     :---      | :--- |
| `secret_token`   | `uuid`     | YES |
| `password`   | `text`     | YES |

## Register your first user
```sh
curl -X POST \
  http://localhost:3000/auth/local/register \
  -H 'Content-Type: application/json' \
  -H 'cache-control: no-cache' \
  -d '{
	"username": "testuser",
	"password": "test"
}'
```
The response: `OK!`

## Login using that user
```sh
curl -X POST \
  http://localhost:3000/auth/local/login \
  -H 'Content-Type: application/json' \
  -H 'cache-control: no-cache' \
  -d '{
    "username": "testuser",
    "password": "test"
}'
```
This will have a valid token in the response:
```json
{
    "jwt_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWFsbG93ZWQtcm9sZXMiOlsidXNlciJdLCJ4LWhhc3VyYS1kZWZhdWx0LXJvbGUiOiJ1c2VyIiwieC1oYXN1cmEtdXNlci1pZCI6IjEifSwiaWF0IjoxNTYxMzY0NTY1LCJleHAiOjE1NjEzNjU0NjV9.j4Jvf_hzxStrs80PQyda9RwM3XClCymHHX_uE-y7Nhc",
    "refresh_token": "b760234c-f36b-47ff-8044-b32e40ee1ad2",
    "user_id": 1
}
```

## OAuth providers

```
/auth/github
/auth/google
```

# Storage

Will act as a proxy between your client and a S3 compatible block storage service (Ex: AWS S3, Digital Ocean Spaces, Minio). Can handle read, write and security permission.
Digital Ocean offer S3-compatible object storage for $5/month with 250 GB of storage with 1TB outbound transfer. https://www.digitalocean.com/products/spaces/.
You can also use open source self hosted private cloud storage solutions like [Minio](https://minio.io/).

### Uploads

Uploads to `/storage/upload`. Will return `key`, `originalname` and `mimetype`. You are able to upload multiple (50) files at the same time.

### Download (get)

Get files at `/storage/file/{key}`.

### Security

Security rules are placed in `storage-tools.js` in the function `validateInteraction`.

`key` = Interacted file. Ex: `/companies/2/customer/3/report.pdf`.

`type` = Operation type. Can be one of: `read`, `write`.

`claims` = JWT claims coming `https://hasura.io/jwt/claims` custom claims in the Hasura JWT token. Ex: `claims['x-hasura-user-id']`.


#### Example:

File:
`src/storage/storage-rules.js`

Code:

```
module.exports = {

  // key - file path
  // type - [ read, write ]
  // claims - claims in JWT
  // this is similar to Firebase Security Rules for files. but not as good looking
  storagePermission: function(key, type, claims) {
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
```

You can see other examples [here](examples) in examples folder.

# nhost-js-sdk

Use [nhost-js-sdk](https://www.npmjs.com/package/nhost-js-sdk) for client side interaction with Hasura Backend Plus.
