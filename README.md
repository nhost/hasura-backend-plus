# hasura-backend-plus
Auth, Storage and Server-Side Functions for Hasura

# Deploy

*Work in progress*

# Configuration


Copy `config-example.js` to `config.js`.
`cp config-example.js config.js`
Edit `config.js`.
`vim config.js`

Create  appropriate storage rules in file `storage-tools.js` in the `validateInteraction` function.

## Auth

*Work in progress...*

## Storage

Will act as a proxy between your client and a S3 compatible block storage service (Ex AWS S3 or Digital Ocean Spaces). Can handle upload, download and security permissions.

### Uploads

Uploads to `/storage/upload`. Will return `key`, `originalname` and `mimetype`. You are able to upload multiple files at the same time.

### Download (get)

Get files at `/storage/file/{key}`.

### Security

Security rules are placed in `storage-tools.js` in the function `validateInteraction`.

`key` = Interacted file. Ex: `/companies/2/customer/3/report.pdf`.

`type` = Operation type. Can be one of: `read`, `write`.

`claims` = JWT claims coming `https://hasura.io/jwt/claims` custom claims in the Hasura JWT token. Ex: `claims['x-hasura-user-id']`.

## Functions

*Work in progress...*
