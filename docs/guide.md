# Getting started

## Installation

### Nhost

The easiest way to deploy HBP is with the official [Nhost](https://nhost.io) managed service. Get your perfect configured backend with PostgreSQL, Hasura and Hasura Backend Plus and save yourself hours of maintenance per month.

All [Nhost](https://nhost.io) projects are built on open source software so you can make realtime web and mobile apps fast 🚀.

<div style="text-align:center;">
  <a href="https://nhost.io/register" target="_blank" >
    <img src="https://github.com/nhost/hasura-backend-plus/raw/master/assets/nhost-register-button.png" width="200px" />
  </a>
</div>

### Docker-Compose

Create the following `docker-compose.yaml` file, and modify the Hasura Admin Secret in both `graphql-engine` and `hasura-backend-plus` services.

<<< @/examples/simple-hasura-minio/docker-compose.yaml

Then start the services:

```shell
export HASURA_GRAPHQL_ADMIN_SECRET=<your Hasura Admin secret>
docker-compose up -d
```

Everything should be up and running. HBP is listening to `http://localhost:3000` and Hasura Graphql Engine is listening to `http://localhost:8080`.

You can then run the Hasura Console in following the [official instructions](https://hasura.io/docs/1.0/graphql/manual/hasura-cli/hasura_console.html).

If you want to get a more advanced example in using an S3-compatible Object Storage, see the [Minio example](recipes#minio) in the recipes.

### Standalone

You can also install HBP without any other service, and connect it to an existing Hasura server, and/or an S3 instance if you plan to use the storage features.
The easiest way is to pull and run a Docker container, but you can also run the service from the source code.

#### Using Docker

```sh
docker run -d -p 3000:3000 \
  -e "HASURA_ENDPOINT=<your Hasura graphql endpoint>" \
  -e "HASURA_GRAPHQL_ADMIN_SECRET=<your Hasura admin secret>" \
  -e "JWT_KEY=<your JWT RSA256 key>" \
  nhost/hasura-backend-plus:latest
```

<!-- TODO You can also pass on the configuration to connect to an S3 service  -->

#### From the source code

```sh
git clone https://github.com/nhost/hasura-backend-plus.git
cd hasura-backend-plus
yarn
cp .env.example .env
yarn start
```

## Registration

By default, anyone can register with an email address and a password:

```shell
curl -d '{"email":"real@emailadress.com", "password":"StrongPasswordNot1234"}' -H "Content-Type: application/json" -X POST http://localhost:3000/auth/register`
```

You can however add some safeguards and limitations to the registration process. More information is available in the [registration configuration chapter](configuration.md#registration)

## Login

## Multi-Factor Authentication

### Generate

### Enable

### Login

### Disable

## Refresh token

## Enable an OAuth provider

## Change email

<!-- TODO in configuration? -->

## Reset password

<!-- TODO in configuration? -->

## Unregister

## Logout
