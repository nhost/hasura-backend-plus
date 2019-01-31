# hasura-backend-plus

This is

[x] Auth
[x] S3 block storage
[ ] Server-Side functions

for Hasura

** This repo is under heavy development right now! :D **

## Deploy

Add to docker-compose.yaml

```
hasura-backend-plus:
  image: elitan/hasura-backend-plus
  environment:
    USER_FIELDS: '<user_fields>'
    GRAPHQL_ENDPOINT: https://<hasura-graphql-endpoint>
    HASURA_ACCESS_KEY: <hasura-access-key>
    JWT_SECRET: <jwt secret>
    S3_ACCESS_KEY_ID: <access>
    S3_SECRET_ACCESS_KEY: <secret>
    S3_ENDPOINT: <endpoint>
    S3_BUCKET: <bucket>
    DOMAIN: <domain-running-this-service>
    ALLOWED_ORIGIN: http://<your-app.com>
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
USER_FIELDS: 'company_id,name'
GRAPHQL_ENDPOINT: hasura-end-point
HASURA_ACCESS_KEY: hasura-access-key
JWT_SECRET: jwt-secret
S3_ACCESS_KEY_ID: access-key-id
S3_SECRET_ACCESS_KEY: secret-access-key
S3_ENDPOINT: ams3.digitaloceanspaces.com
S3_BUCKET: bucketname
DOMAIN: your-app.com
ALLOWED_ORIGIN: https://your-app.com
```

TODO: Explain env variables

# Auth

Working.

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
