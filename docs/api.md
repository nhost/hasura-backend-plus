# API

| Category                          | Endpoint                                                       | Description                               |
| --------------------------------- | -------------------------------------------------------------- | ----------------------------------------- |
| [Authentication](#authentication) | [POST /auth/register](#registration)                           | Account registration                      |
| ^^                                | [POST /auth/login](#login)                                     | Login                                     |
| ^^                                | [POST /auth/logout](#logout)                                   | Logout                                    |
| ^^                                | [GET /auth/jwks](#jwks)                                        | JWK Set                                   |
| ^^                                | [POST /auth/activate](#activate-account)                       | Activate account                          |
| ^^                                | [POST /auth/delete](#delete-account)                           | Delete account                            |
| ^^                                | [POST /auth/change-password/](#change-password)                | Change password                           |
| ^^                                | [POST /auth/change-password/request](#change-password-request) | Request to change password password       |
| ^^                                | [POST /auth/change-password/change](#change-password-change)   | Change password                           |
| ^^                                | [POST /auth/change-email/](#)                                  | Change email (without email verification) |
| ^^                                | [POST /auth/change-email/request](#)                           | Request email change                      |
| ^^                                | [POST /auth/change-email/change](#)                            | Change email                              |
| ^^                                | [POST /auth/token/refresh](#refresh-token)                     | Get new refresh token                     |
| ^^                                | [POST /auth/token/revoke](#revoke-refresh-token)               | Revoke tokens                             |
| ^^                                | [POST /auth/mfa/generate](#generate-mfa-qr-code)               | Generate MFA QR code                      |
| ^^                                | [POST /auth/mfa/enable](#enable-mfa)                           | Enable MFA                                |
| ^^                                | [POST /auth/mfa/disable](#disable-mfa)                         | Disable MFA                               |
| ^^                                | [POST /auth/mfa/totp](#totp)                                   | TOTP                                      |
| [Storage](storage)                | [GET /storage/o/\<rule-path\>](#)                              | Get file                                  |
| ^^                                | [GET /storage/m/\<rule-path\>](#)                              | Get metadata of file                      |
| ^^                                | [GET /storage/o/\<rule-path\>/](#)                             | Get zip of all files in directory         |
| ^^                                | [GET /storage/m/\<rule-path\>/](#)                             | Get metadata of all files in direcotry    |
| ^^                                | [POST /storage/o/\<rule-path\>](#)                             | Upload a file                             |
| ^^                                | [DELETE /storage/o/\<rule-path\>](#)                           | Delete a file                             |
| [Other](#other)                   | [GET /healthz](#health-check)                                  | Health Check                              |

## Authentication

### Registration

Register a new user.

`POST /auth/register`

#### Request

```json
{
  "email": "hello@example.com",
  "password": "between MIN_PASSWORD_LENGTH-128 characters"
}
```

#### Response

```
204 No Content
```

---

### Login

Login a user.

`POST /auth/login`

#### Request

```json
{
  "email": "hello@example.com",
  "password": "secretpassword"
}
```

#### Response

```
Set-Cookie: refresh_token=...
Set-Cookie: permission_variables=...
```

```json
{
  "mfa": false,
  "jwt_token": "...",
  "jwt_expires_in": 900000
}
```

If Multi Factor Authentication (MFA) is enabled for the account the following response body is returned:

```json
{
  "mfa": true,
  "ticket": "..."
}
```

For login with MFA, proceed authentication by requesting the [TOTP](#totp) `/auth/mfa/totp` endpoint.

---

### Logout

Logout a user.

`POST /auth/logout`

#### Request

```
<empty>
```

#### Response

```
204 No Content
```

---

### JWK

JWK. This endpoint is active if env var `JWT_ALGORITHM` is one of `['RS256', 'RS384', 'RS512']`.

`GET /auth/jwks`

#### Request

```
<empty>
```

#### Response

```json
{
  "keys": [...]
}
```

---

### Activate account

Activate account. This endpoint is active if env var `AUTO_ACTIVATE_NEW_USERS=false` (default `true`).

`POST /auth/activate`

#### Request

```json
{
  "ticket": "0175b2e2-b6b5-4d3f-a5db-5b2d4bfc2ce7"
}
```

#### Response

```
204 No Content
```

---

### Delete Account

Delete account. This endpoint is active if env var `ALLOW_USER_SELF_DELETE=true` (default `false`).

`POST /auth/delete`

#### Request

```
<empty>
```

#### Response

```
204 No Content
```

---

### Change password

Change password of an account. The user must be logged in for this endpoint to work.

`POST /auth/change-password/`

#### Request

```json
{
  "old_password": "secretpassword",
  "new_password": "newsecretpassword"
}
```

#### Response

```
204 No Content
```

---

### Change Password Request

Request to change password. This endpoint is active if env var `LOST_PASSWORD_ENABLE=true`.

::: warning
This endpoint will always return HTTP status code 204 in order to not leak information about the database.
:::

`POST /auth/change-password/request`

#### Request

```json
{
  "email": "hello@example.com"
}
```

#### Response

```
204 No Content
```

### Change Password Change

Change password based on a ticket. This endpoint is active if env var `LOST_PASSWORD_ENABLE=true`.

`POST /auth/change-password/change`

#### Request

```json
{
  "ticket": "uuid",
  "new_password": "newsecretpassword"
}
```

#### Response

```
204 No Content
```

---

### Change Email

Change email without email verification as a logged in user. This endpoint is only active if env var `VARIFY_EMAILS=false` (default ``).

`POST /auth/change-email/`

#### Request

```json
{
  "new_email": "new-hello@example.com"
}
```

#### Response

```
204 No Content
```

### Change Email Request

Send request for the new email that the account wants to change to. This endpoint is only active if `VERIFY_EMAILS=true`.

`POST /auth/change-email/request`

#### Request

```json
{
  "new_email": "new-hello@example.com"
}
```

#### Response

```
204 No Content
```

### Change Email Change

Change email to the new email that you specified in [Change Email Request](#change-email-request). This endpoint is only active if `VERIFY_EMAILS=true`.

`POST /auth/change-email/change`

#### Request

```json
{
  "ticket": "uuid-ticket"
}
```

#### Response

```
204 No Content
```

### Refresh token

Get new refresh token. The browser will send the cookie automatically.

`POST /auth/token/refresh`

#### Request

```
Cookie: refresh_token=...
```

#### Response

```
Set-Cookie: refresh_token=...
```

```json
{
  "jwt_token": "token",
  "jwt_expires_in": 900000
}
```

---

### Revoke Refresh Token

Revoke a refresh token.

`POST /auth/token/revoke/`

#### Request

```
Cookie: refresh_token=...
```

#### Response

```
204 No Content
```

---

### Generate MFA QR code

#### Request

```
<empty>
```

#### Response

```json
{
  "image_url": "base64_data_image_of_qe_code",
  "otp_secret": "..."
}
```

### Enable MFA

Enable Multi Factor Authentication.

#### Request

```json
{
  "code": "892723"
}
```

#### Response

```
204 No Content
```

### Disable MFA

Disable Multi Facetor Authentication.

#### Request

```json
{
  "code": "code-from-mfa-client"
}
```

#### Response

```
204 No Content
```

### TOTP

Time-based One-time Password. Use the `ticket` from [Login](#login) that is returned if the account has activated MFA.

#### Request

```json
{
  "code": "code-from-mfa-client",
  "ticket": "uuid-ticket"
}
```

#### Response

```
Set-Cookie: refresh_token=...
```

```json
{
  "jwt_token": "jwt-token",
  "jwt_expires_in": 900000
}
```

## Storage

TODO

---

### Health Check

Simple health check.

`GET /healthz`

#### Response

```
200 OK
```
