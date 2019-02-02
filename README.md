# hasura-backend-plus

This is

- [x] Auth
- [x] Files (S3-compatible Object Storage)

for Hasura

## Deploy

Add to `docker-compose.yaml`:

```
hasura-backend-plus:
  image: elitan/hasura-backend-plus
  environment:
    USER_FIELDS: '<user_fields>'
    HASURA_GRAPHQL_ENDPOINT: https://<hasura-graphql-endpoint>
    HASURA_GRAPHQL_ACCESS_KEY: <hasura-access-key>
    HASURA_GRAPHQL_JWT_SECRET: '{"type": "HS256", "key": "secret_key"}'
    S3_ACCESS_KEY_ID: <access>
    S3_SECRET_ACCESS_KEY: <secret>
    S3_ENDPOINT: <endpoint>
    S3_BUCKET: <bucket>
    DOMAIN: <domain-running-this-service>
    REFETCH_TOKEN_EXPIRES: 54000
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
```

Restart your docker containers

`docker-compose up -d`

## Configuration

ENV VARIABLES:
```
USER_FIELDS: '<user_fields>'
HASURA_GRAPHQL_ENDPOINT: https://<hasura-graphql-endpoint>
HASURA_GRAPHQL_ACCESS_KEY: <hasura-access-key>
HASURA_GRAPHQL_JWT_SECRET: '{"type": "HS256", "key": "secret_key"}'
S3_ACCESS_KEY_ID: <access>
S3_SECRET_ACCESS_KEY: <secret>
S3_ENDPOINT: <endpoint>
S3_BUCKET: <bucket>
DOMAIN: <domain-running-this-service>
REFETCH_TOKEN_EXPIRES: 54000
```

TODO: Explain env variables

# Auth

```
/register
/activate-account
/sign-in
/refetch-token
/new-password
```


# Storage

Will act as a proxy between your client and a S3 compatible block storage service (Ex AWS S3 or Digital Ocean Spaces). Can handle read, write and security permission.

### Uploads

Uploads to `/storage/upload`. Will return `key`, `originalname` and `mimetype`. You are able to upload multiple (50) files at the same time.

### Download (get)

Get files at `/storage/file/{key}`.

### Security

Security rules are placed in `storage-tools.js` in the function `validateInteraction`.

`key` = Interacted file. Ex: `/companies/2/customer/3/report.pdf`.

`type` = Operation type. Can be one of: `read`, `write`.

`claims` = JWT claims coming `https://hasura.io/jwt/claims` custom claims in the Hasura JWT token. Ex: `claims['x-hasura-user-id']`.

# Functions

*Work in progress...*
