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

Everything shoudl be up and running. HBP is listening to `http://localhost:3000` and Hasura Graphql Engine is listening to `http://localhost:8080`.

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

## User registration

By default, any client connecting to HBP can register with a valid email address. Registration requires a valid email and password:

```shell
curl -d '{"email":"real@emailadress.com", "password":"StrongPasswordNot1234"}' -H "Content-Type: application/json" -X POST http://localhost:3000/auth/register`
```

You can however add some safeguards to the registration process.

### Limit email domains

You can limit registration to ranges of emails that are only part of a whitelist. For instance, you may want to limit registration only to the email addresses of your own organisation. You can pass a list of comma-separated email domains to the `ALLOWED_EMAIL_DOMAINS` environment variable, for instance:

```
ALLOWED_EMAIL_DOMAINS=gmail.com,yourorganisation.com
```

### Minimum password length

By default, clients can register with a password of at least three characters. You can change this in setting a higher value:

```
MIN_PASSWORD_LENGTH=6
```

### Check password simplicity against Have I Been Pwned

You can ask HBP to check on [Have I Been Pwned](https://haveibeenpwned.com/Passwords) if the password has been previously exposed in data breaches. If so, the registration will fail. This option is disabled by default.

```
HIBP_ENABLE=false
```

### Add registration fields

You may want to extend the `public.users` table with your own fields and relations, and to expect the client to set some of them when registering. It is possible to set a list of columns in the `REGISTRATION_CUSTOM_FIELDS` environment value.

<!-- TODO link to the page on schema -->

Here is an example on the way to proceed to add a `nickname` value to the registration:

1. Add a column `nickname` of type text to the `public.users` table
2. Set the environment variable `REGISTRATION_CUSTOM_FIELDS=nickname`
3. The registration endpoint now expects a `nickname` value in addition to `email` and `password`

::: warning
Any given column must exist, otherwise registration will fail.
:::

<!-- TODO link to JWT custom claims -->

## Activation

As we activated the sending of confirmation emails by default, and any email can register by default, your will soon receive a confirmation link in your inbox.

Click on the link and...

## Login

## Multi-Factor Authentication

### Generate

### Enable

### Login

### Disable
