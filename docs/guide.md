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

### Docker-compose

Create the following `docker-compose.yaml` file, and modify the Hasura Admin Secret in both `graphql-engine` and `hasura-backend-plus` services.

<<< @/examples/simple-hasura-minio/docker-compose.yaml

Then start the services:

```shell
docker-compose up -d
```

Everything is now up and running.

If you want to get a more advanced example in using an S3-compatible Object Storage, see the [Minio example](recipes#minio) in the recipes.

### Standalone

#### Docker

#### Source Code

## Registration

```shell
curl -d '{"email":"real@emailadress.com", "password":"StrongPasswordNot1234"}' -H "Content-Type: application/json" -X POST http://localhost:3000/auth/register`
```

## Activation

As we activated the sending of confirmation emails by default, and any email can register by default, your will soon receive a confirmation link in your inbox.

Click on the link and...

## Login

## Multi-Factor Authentication

### Generate

### Enable

### Login

### Disable
