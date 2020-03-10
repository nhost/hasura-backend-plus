# Authway

![Version](https://img.shields.io/badge/version-1.0.6-blue.svg?cacheSeconds=2592000)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Authentication server for Hasura that does the job 💪

### Features:

- 🔐 Secure password hashing with [Argon2](https://github.com/P-H-C/phc-winner-argon2).
- 👨‍💻 Codebase is written in 100% [TypeScript](https://www.typescriptlang.org).
- ✅ Optional checking for [Pwned Passwords](#pwned-passwords).
- 📈 Rate limiting is enabled for all API routes.
- 🎨 Fully customizable with sensible defaults.
- 🚀 Easy to setup, can be deployed anywhere.

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
$ hasura init hasura --endpoint "<endpoint>" --admin-secret "<admin-secret>"
$ mv hasura/config.yaml . && rm -rf hasura && hasura migrate apply
```

Make sure to add `user` to the `public.roles` table through the Hasura Console.

Copy the `.env.example` file to `.env`:

```sh
$ cp .env.example .env && $EDITOR $_
```

Edit the file and start the server 🚀

```sh
$ npm i -g pm2
$ pm2 start npm --name "authway" -- start
```

## Update

You can apply the latest updates by running:

```sh
$ git pull origin
$ npm install
$ pm2 restart authway
```

To confirm that everything's working properly, run:

```sh
$ pm2 logs authway
```

## Pwned Passwords

Authway comes with an opt-in feature to check passwords against the [HIBP](https://haveibeenpwned.com) API. These checks are only performed during registration and password recovery. The password is given in plain text, [but only the first 5 characters of its SHA-1 hash will be submitted to the API](https://github.com/wKovacs64/hibp/blob/develop/API.md#pwnedpassword). Enable the feature by setting `HIBP_ENABLED` to true in your `.env` file.

## API Documentation

All fields are required. See [this article](https://hasura.io/blog/best-practices-of-using-jwt-with-graphql) for information on handling JWTs in the client.

### `POST /register`

Expects the following fields in the JSON body: `email`, `password` and `username`.

- `email`: Valid email address.
- `password`: String between 6-128 characters in length.
- `username`: Alpha-numeric string between 2-32 characters in length.

Returns `204 No Content` if account is successfully created.

### `POST /activate`

Expects the following field in the JSON body: `secret_token`.

- `secret_token`: Valid v4 UUID string.

Returns `204 No Content` if account is successfully activated.

### `POST /login`

Expects the following fields in the JSON body: `email` and `password`.

- `email`: Valid email address.
- `password`: String between 6-128 characters in length.

Returns the following on successful login:

- `httpOnly` cookie named `refresh_token`.
- `jwt_token` and `jwt_token_expiry` in the JSON response.

### `POST /refresh`

Expects the following field in the JSON body: `refresh_token`.

- `refresh_token`: Valid v4 UUID string.

Returns the following on successful login:

- `httpOnly` cookie named `refresh_token`.
- `jwt_token` and `jwt_token_expiry` in the JSON response.

### `POST /forgot`

Expects the following fields in the JSON body: `secret_token` and `password`.

- `secret_token`: Valid v4 UUID string.
- `password`: String between 6-128 characters in length.

Returns `204 No Content` if password is successfully changed.

## 🚧 Roadmap

- [ ] Confirmation emails
- [ ] Password recovery emails
- [ ] Two-factor authentication

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

Feel free to check the [issues page](https://github.com/pnfcre/authway/issues).

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © [Hampus Kraft](https://github.com/pnfcre).

This project is [MIT](LICENSE) licensed.

---

This project is inspired by [Hasura Backend Plus](https://github.com/nhost/hasura-backend-plus).
