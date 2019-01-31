# hasura-backend-plus

Auth, Storage and Server-Side Functions for Hasura

** This repo is under heavy development right now! :D **

## Deploy

*Work in progress*

## Configuration

ENV VARIABLES:
```
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
