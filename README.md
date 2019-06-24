<p align="center">
  <a href="https://github.com/elitan/hasura-backend-plus">
    <img src="logo.png" width="250px" alt="HB+" />
  </a>
</p>

---

<h1 align="center">Hasura Backend Plus ( HB+ )</h1>
<h4 align="center">Auth & Files (S3-compatible Object Storage) for Hasura</h4>

# Setup

## Get your database ready

Create tables and initial state for your user mangagement.

```
CREATE TABLE roles (
  name text NOT NULL PRIMARY KEY
);

INSERT INTO roles (name) VALUES ('user');

CREATE TABLE users (
  id bigserial PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  active boolean NOT NULL DEFAULT false,
  secret_token uuid NOT NULL,
  default_role text NOT NULL DEFAULT 'user',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  FOREIGN KEY (default_role) REFERENCES roles (name)
);

CREATE TABLE users_x_roles (
  id bigserial PRIMARY KEY,
  user_id int NOT NULL,
  role text NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (role) REFERENCES roles (name),
  UNIQUE (user_id, role)
);

CREATE TABLE refetch_tokens (
  id bigserial PRIMARY KEY,
  refetch_token uuid NOT NULL UNIQUE,
  user_id int NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## Track your tables and relations in Hasura

Go to the Hasura console. Click the "Data" menu link and then click "Track all" under both "Untracked tables or views" and "Untracked foreign-key relations"

## Create minimal storage rules

In the same directory where you have your `docker-compose.yaml` for your Hasura and HB+ project. Do the following:

```
mkdir storage-rules
vim storage-rules/index.js

add this:
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
  image: elitan/hasura-backend-plus
  environment:
    PORT: 3000
    USER_FIELDS: ''
    USER_REGISTRATION_AUTO_ACTIVE: 'true'
    HASURA_GRAPHQL_ENDPOINT: http://graphql-engine:8080/v1alpha1/graphql
    HASURA_GRAPHQL_ADMIN_SECRET: <hasura-admin-secret>
    HASURA_GRAPHQL_JWT_SECRET: '{"type": "HS256", "key": "secret_key"}'
    S3_ACCESS_KEY_ID: <access>
    S3_SECRET_ACCESS_KEY: <secret>
    S3_ENDPOINT: <endpoint>
    S3_BUCKET: <bucket>
    REFETCH_TOKEN_EXPIRES: 43200
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
<domain-running-this-service> {
  proxy / hasura-backend-plus:3000
}

Ex:
backend.myapp.io {
  proxy / hasura-backend-plus:3000
}

```

Restart your docker containers

`docker-compose up -d`

## Configuration

### ENV VARIABLES:
```
USER_FIELDS: '<user_fields>' // separate with comma. Ex: 'company_id,sub_org_id'
HASURA_GRAPHQL_ENDPOINT: https://<hasura-graphql-endpoint>
HASURA_GRAPHQL_ADMIN_SECRET: <hasura-admin-secret>
HASURA_GRAPHQL_JWT_SECRET: '{"type": "HS256", "key": "secret_key"}'
S3_ACCESS_KEY_ID: <access>
S3_SECRET_ACCESS_KEY: <secret>
S3_ENDPOINT: <endpoint>
S3_BUCKET: <bucket>
DOMAIN: <domain-running-this-service>
REFETCH_TOKEN_EXPIRES: 54000
JWT_TOKEN_EXPIRES: 15
USER_MANAGEMENT_DATABASE_SCHEMA_NAME: 'user_management' // use this if you have all your user tables in another schema (not public)
```

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

#### HASURA_GRAPHQL_ENDPOINT

*more explanations coming soon*

# Auth

```
/auth/register
/auth/activate-account
/auth/login
/auth/refetch-token
/auth/new-password
```


## Register your first user
```sh
curl -X POST \
  http://localhost:3000/auth/register \
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
  http://localhost:3000/auth/login \
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
    "refetch_token": "b760234c-f36b-47ff-8044-b32e40ee1ad2",
    "user_id": 1
}
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
