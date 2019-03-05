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
    USER_FIELDS: '<user_fields>' // separate with comma. Ex: 'company_id,sub_org_id'
    USER_REGISTRATION_AUTO_ACTIVE: 'false' // or 'true'
    HASURA_GQE_ENDPOINT: https://<hasura-graphql-endpoint>
    HASURA_GQE_ADMIN_SECRET: <hasura-admin-secret>
    HASURA_GQE_JWT_SECRET: '{"type": "HS256", "key": "secret_key"}'
    S3_ACCESS_KEY_ID: <access>
    S3_SECRET_ACCESS_KEY: <secret>
    S3_ENDPOINT: <endpoint>
    S3_BUCKET: <bucket>
    DOMAIN: <domain-running-this-service>
    REFETCH_TOKEN_EXPIRES: 54000
  volumes:
  ./storage-rules.js:/app/src/storage/storage-rules.js

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

### ENV VARIABLES:
```
USER_FIELDS: '<user_fields>' // separate with comma. Ex: 'company_id,sub_org_id'
HASURA_GQE_ENDPOINT: https://<hasura-graphql-endpoint>
HASURA_GQE_ADMIN_SECRET: <hasura-admin-secret>
HASURA_GQE_JWT_SECRET: '{"type": "HS256", "key": "secret_key"}'
S3_ACCESS_KEY_ID: <access>
S3_SECRET_ACCESS_KEY: <secret>
S3_ENDPOINT: <endpoint>
S3_BUCKET: <bucket>
DOMAIN: <domain-running-this-service>
REFETCH_TOKEN_EXPIRES: 54000
```

#### USER_FIELDS

If you have some specific fields on your users that you also want to have as a JWT claim you can specify those user fields in the `USER_FIELDS` env var.

So lets say you have a user table like:

* id
* email
* password
* role
* company_id

and you want to include the `company_id` as a JWT claim. You can specify `USER_FIELDS=company_id`.

Then you will have a JWT a little something like this:

```
{
  "https://hasura.io/jwt/claims": {
    "x-hasura-allowed-roles": [
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

#### HASURA_GQE_ENDPOINT

*more explanations coming soon*

# Auth

```
/register
/activate-account
/sign-in
/refetch-token
/new-password
```


# Storage

Will act as a proxy between your client and a S3 compatible block storage service (Ex AWS S3 or Digital Ocean Spaces). Can handle read, write and security permission. Digital Ocean offer S3-compatible object storage for $5/month with 250 GB of storage with 1TB outbound transfer. https://www.digitalocean.com/products/spaces/.

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
	validateInteraction: function(key, type, claims) {
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
