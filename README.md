# Authway

![Version](https://img.shields.io/badge/version-1.0.2-blue.svg?cacheSeconds=2592000)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Authentication server for Hasura that does the job 💪

## Install

You need [Node.js](https://nodejs.org) installed on your machine.

```sh
$ git clone https://github.com/pnfcre/authway.git
$ cd authway
```

Install the required dependencies.

```sh
$ npm install
```

## Usage

Start your Hasura instance with the following [environment variables](https://hasura.io/docs/1.0/graphql/manual/deployment/graphql-engine-flags/config-examples.html) set:

```sh
HASURA_GRAPHQL_ADMIN_SECRET: a_very_secure_admin_secret_goes_here
HASURA_GRAPHQL_JWT_SECRET: '{"type": "HS256", "key": "a_very_secure_jwt_secret_goes_here"}'
```

Install the Hasura CLI to run migrations:

```sh
$ npm i -g hasura-cli
$ hasura migrate apply --endpoint "<endpoint>" --admin-secret "<admin-secret>"
```

Copy the `.env.example` file to `.env`:

```sh
$ cp .env.example .env && $EDITOR $_
```

Edit the file and start the server 🚀

```sh
$ npm i -g pm2
$ pm2 start npm --name "authway" -- start
```

## API Documentation

All fields are required.

### `POST /register`

Expects the following fields in the JSON body: `email`, `password` and `username`.

- `email`: Valid email address.
- `password`: String between 6-128 characters in length.
- `username`: Alpha-numeric string between 2-32 characters in length.

Returns `204 No Content` if account is successfully created.

### `POST /activate`

Expects the following field in the JSON body: `secret_token`.

- `secret_token`: Valid UUIDv4 string.

Returns `204 No Content` if account is successfully activated.

### `POST /login`

Expects the following fields in the JSON body: `email` and `password`.

- `email`: Valid email address.
- `password`: String between 6-128 characters in length.

Returns the following fields on successful login: `refresh_token` and `jwt_token`.

### `POST /refresh`

Expects the following field in the JSON body: `refresh_token`.

- `refresh_token`: Valid UUIDv4 string.

Returns the following fields if successful: `refresh_token` and `jwt_token`.

### `POST /forgot`

Expects the following fields in the JSON body: `secret_token` and `password`.

- `secret_token`: Valid UUIDv4 string.
- `password`: String between 6-128 characters in length.

Returns `204 No Content` if password is successfully changed.

## Author

👤 **Hampus Kraft**

- Website: https://pnfc.re
- Twitter: [@pnfcre](https://twitter.com/pnfcre)
- Github: [@pnfcre](https://github.com/pnfcre)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

Feel free to check [issues page](https://github.com/pnfcre/authway/issues).

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2020 [Hampus Kraft](https://github.com/pnfcre).

This project is [MIT](LICENSE) licensed.

---

This project is inspired by [Hasura Backend Plus](https://github.com/nhost/hasura-backend-plus).
