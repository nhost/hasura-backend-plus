# hasura-backend-plus
Auth, Storage and Server-Side Functions for Hasura


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


## Functions

*Work in progress...*
