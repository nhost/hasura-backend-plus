# hasura-backend-plus
Auth, Storage and Server-Side Functions for Hasura


## Auth

*Work in progress...*

## Storage

### Uploads

Uploads to `/storage/upload`. Will return `key`, `originalname` and `mimetype`. You are able to upload multiple files at the same time.

### Download (get)

Get files at `/storage/file/{key}`.

### Security

Security rules are placed in `storage-tools.js` in the function `validateInteraction`.


## Functions

*Work in progress...*
