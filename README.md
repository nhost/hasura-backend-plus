<p align="center">
  <a href="https://github.com/nhost/hasura-backend-plus">
    <img
      src="docs/.vuepress/public/logo.png"
      width="250px"
      alt="HBP"
    />
  </a>
</p>

<p align="center">
  <img
    src="https://img.shields.io/badge/version-1.2.0-blue.svg?cacheSeconds=2592000"
  />

  <a href="LICENSE">
    <img
      src="https://img.shields.io/badge/License-MIT-yellow.svg"
      alt="License: MIT"
    />
  </a>
</p>

<h3 align="center">Hasura Backend Plus (HBP)</h3>
<h4 align="center">Auth & Files (S3-Compatible Object Storage) for Hasura</h4>

---

# Nhost

The easiest way to deploy HBP is with our official [Nhost](https://nhost.io) managed service. Get your perfectly configured backend with PostgreSQL, Hasura and Hasura Backend Plus and save yourself hours of maintenance per month.

All [Nhost](https://nhost.io) projects are built on open source software so you can make real-time web and mobile apps fast 🚀

<a href="https://nhost.io/register">
  <img
    src="docs/.vuepress/public/nhost-register-button.png"
    width="200px"
  />
</a>

[https://nhost.io](https://nhost.io)

---

### Core Features:

- 🔐 Secure password hashing with [Argon2](https://github.com/P-H-C/phc-winner-argon2).
- 👨‍💻 Codebase is written in 100% [TypeScript](https://www.typescriptlang.org).
- ✅ Optional checking for [Pwned Passwords](#pwned-passwords).
- 🎨 Fully customizable with sensible defaults.
- 📈 Rate limit your API endpoints by default.
- 🚀 Easy to setup, can be deployed anywhere.
- 🔑 Two-factor authentication support.

## Install

You need [Node.js](https://nodejs.org) installed on your machine.

```sh
$ git clone https://github.com/nhost/hasura-backend-plus.git
$ cd hasura-backend-plus && git checkout v2
```

Install the required dependencies.

```sh
$ npm install
```

## Usage

Start your Hasura instance with the following [environment variables](https://hasura.io/docs/1.0/graphql/manual/deployment/graphql-engine-flags/config-examples.html) set:

```sh
HASURA_GRAPHQL_ADMIN_SECRET: a_very_secure_admin_secret_goes_here
HASURA_GRAPHQL_JWT_SECRET: {"type": "RS256", "jwk_url": "http://your-auth-service/auth/jwks"}
```

Install the Hasura CLI to run migrations:

```sh
$ npm i -g hasura-cli
$ hasura init hasura --endpoint "<endpoint>" --admin-secret "<admin-secret>"
$ mv hasura/config.yaml . && rm -rf hasura && hasura migrate apply
```

Copy the `.env.example` file to `.env`:

```sh
$ cp .env.example .env && $EDITOR $_
```

Edit the file and start the server 🚀

```sh
$ npm i -g pm2
$ pm2 start npm --name "hbp" -- start
```

## Update

You can apply the latest updates by running:

```sh
$ git pull origin
$ npm install
$ hasura migrate apply
$ pm2 restart hbp
```

To confirm that everything's working properly, run:

```sh
$ pm2 logs hbp
```

## Pwned Passwords

HBP v2 comes with an opt-in feature to check passwords against the [HIBP](https://haveibeenpwned.com) API. These checks are only performed during registration and password recovery. The password is given in plain text, [but only the first 5 characters of its SHA-1 hash will be submitted to the API](https://github.com/wKovacs64/hibp/blob/develop/API.md#pwnedpassword). Enable the feature by setting `HIBP_ENABLED` to true in your `.env` file.

## Signed Cookies

HBP v2 comes with an opt-in feature to sign cookies. You can enable it by setting `COOKIE_SECRET` to something strong and secure in your `.env` file. Be careful, though — existing unsigned refresh tokens will stop working.

## API Documentation

All fields are required. See [this article](https://hasura.io/blog/best-practices-of-using-jwt-with-graphql) for information on handling JWTs in the client.

<details>
<summary><strong>POST /auth/login</strong></summary>

## Request:

```json
{
  "email": "hello@example.com",
  "password": "between 6-128 characters"
}
```

## Response:

```
Set-Cookie: refresh_token=...
```

```json
{
  "jwt_token": "...",
  "jwt_expires_in": 900000
}
```

> If MFA is enabled for the account, a `ticket` is returned in the JSON response.<br />
> Proceed authentication by requesting the `/auth/mfa/totp` endpoint (see below).

</details>

<details>
<summary><strong>POST /auth/register</strong></summary>

## Request:

```json
{
  "email": "hello@example.com",
  "password": "between 6-128 characters",
  "username": "alphanumeric string between 2-32 in length"
}
```

## Response:

```
204 No Content
```

</details>

---

<details>
<summary><strong>POST /auth/user/activate</strong></summary>

## Request:

```json
{
  "ticket": "0175b2e2-b6b5-4d3f-a5db-5b2d4bfc2ce7"
}
```

## Response:

```
204 No Content
```

</details>

<details>
<summary><strong>POST /auth/user/forgot</strong></summary>

## Request:

```json
{
  "ticket": "6a135423-85c8-4c99-b9ca-3a0108202255",
  "new_password": "between 6-128 characters"
}
```

## Response:

```
204 No Content
```

</details>

<details>
<summary><strong>POST /auth/user/remove</strong></summary>

## Request:

```
Authorization: Bearer ...
```

## Response:

```
204 No Content
```

</details>

---

<details>
<summary><strong>POST /auth/token/refresh</strong></summary>

## Request:

```
Cookie: refresh_token=...
```

## Response:

```
Set-Cookie: refresh_token=...
```

```json
{
  "jwt_token": "...",
  "jwt_expires_in": 900000
}
```

</details>

<details>
<summary><strong>POST /auth/token/revoke</strong></summary>

## Request:

```
Authorization: Bearer ...
```

## Response:

```
204 No Content
```

</details>

---

<details>
<summary><strong>POST /auth/mfa/generate</strong></summary>

## Request:

```
Authorization: Bearer ...
```

## Response:

```json
{
  "image_url": "...",
  "otp_secret": "..."
}
```

</details>

<details>
<summary><strong>POST /auth/mfa/enable</strong></summary>

## Request:

```
Authorization: Bearer ...
```

```json
{
  "code": "892723"
}
```

## Response:

```
204 No Content
```

</details>

<details>
<summary><strong>POST /auth/mfa/disable</strong></summary>

## Request:

```
Authorization: Bearer ...
```

```json
{
  "code": "109509"
}
```

## Response:

```
204 No Content
```

</details>

---

<details>
<summary><strong>POST /auth/mfa/totp</strong></summary>

## Request:

```json
{
  "code": "364124",
  "ticket": "259878d6-87be-4729-a3cc-53548f7ff72c"
}
```

## Response:

```
Set-Cookie: refresh_token=...
```

```json
{
  "jwt_token": "...",
  "jwt_expires_in": 900000
}
```

</details>

---

<details>
<summary><strong>POST /storage/upload</strong></summary>

## Request:

### Headers

```
ContentType: application/x-www-form-urlencoded
x-path: <key>
Authorization: Bearer ...
```

### Body

form-data

```
key: file, value: <file>
```

## Response:

```json
{
  "key": "...",
  "mimetype": "...",
  "token": "..."
}
```

</details>

<details>
<summary><strong>GET /storage/file/`key`?token=`token`</strong></summary>

## Request:

## Response:

File

</details>

<details>
<summary><strong>GET /storage/file-meta/`key`</strong></summary>

## Request:

### Headers

```
Authorization: Bearer ...
```

## Response:

```json
{
  "key": "...",
  "mimetype": "...",
  "token": "..."
}
```

</details>

<details>
<summary><strong>DELETE /storage/file-meta/`key`</strong></summary>

## Request:

### Headers

```
Authorization: Bearer ...
```

## Response:

```
204 No Content
```

</details>

---

<details>
<summary><strong>GET /healthz</strong></summary>

Simple health check.

## Response:

```
OK
```

</details>

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

Feel free to check the [issues page](https://github.com/nhost/hasura-backend-plus/issues).

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

This project is [MIT](LICENSE) licensed.
