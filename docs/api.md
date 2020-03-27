---
endpoints:
  - category: Authentication
    endpoints:
      - path: /auth/register
        name: Account registration
        description: Long description
        request:
          email: hello@example.com
          password: between 6-128 characters
        response: 204 No Content
      - path: /auth/login
        name: Account login
        description: Long description
        request:
          email: hello@example.com
          password: between 6-128 characters
        response: 'Set-Cookie: refresh_token=...'
---

# API

| Category                          | Path                                             | Description          |
| --------------------------------- | ------------------------------------------------ | -------------------- |
| [Authentication](#authentication) | [POST /auth/register](#registration)             | Account registration |
| ^^                                | [POST /auth/login](#login)                       | Account login        |
| ^^                                | [POST /auth/account/activate](#activation)       | Account activation   |
| ^^                                | [POST /auth/account/forgot](#forgotten-password) | Forgotten password   |
| ^^                                | [POST /auth/account/remove](#remove-account)     | Remove account       |
| ^^                                | [POST /auth/token/refresh](#refresh-token)       | Refresh token        |
| ^^                                | [POST /auth/token/revoke](#revoke-token)         | Revoke token         |
| ^^                                | [POST /auth/mfa/generate](#generate-mfa-qr-code) | Generate MFA QR code |
| ^^                                | [POST /auth/mfa/enable](#enable-mfa)             | Enable MFA           |
| ^^                                | [POST /auth/mfa/disable](#disable-mfa)           | Disable MFA          |
| ^^                                | [POST /auth/mfa/totp](#totp)                     | TOTP                 |
| [Other](#other)                   | [GET /healthz](#health-check)                    | Health Check         |

## Authentication

### Registration

#### Request

```json
{
  "email": "hello@example.com",
  "password": "between 6-128 characters"
}
```

#### Response

```
204 No Content
```

### Login

###### Request

```json
{
  "email": "hello@example.com",
  "password": "between 6-128 characters"
}
```

#### Response

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

### Activation

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

### Forgotten password

#### Request

```json
{
  "ticket": "6a135423-85c8-4c99-b9ca-3a0108202255",
  "new_password": "between 6-128 characters"
}
```

#### Response

```
204 No Content
```

### Remove account

#### Request

```
Authorization: Bearer ...
```

#### Response

```
204 No Content
```

### Refresh token

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
  "jwt_token": "...",
  "jwt_expires_in": 900000
}
```

### Revoke token

#### Request

```
Authorization: Bearer ...
```

#### Response

```
204 No Content
```

### Generate MFA QR code

#### Request

```
Authorization: Bearer ...
```

#### Response

```json
{
  "image_url": "...",
  "otp_secret": "..."
}
```

### Enable MFA

#### Request

```
Authorization: Bearer ...
```

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

#### Request

```
Authorization: Bearer ...
```

```json
{
  "code": "109509"
}
```

#### Response

```
204 No Content
```

### TOTP

#### Request

```json
{
  "code": "364124",
  "ticket": "259878d6-87be-4729-a3cc-53548f7ff72c"
}
```

#### Response

```
Set-Cookie: refresh_token=...
```

```json
{
  "jwt_token": "...",
  "jwt_expires_in": 900000
}
```

## Other

### Health Check

Simple health check.

#### Response

```
OK
```
