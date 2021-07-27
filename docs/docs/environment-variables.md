---
title: Environment Variables
---

## Authentication

### `AUTH_ENABLED`

Default value: `true`

Enables users to use all authentication routes. If `AUTH-ENABLED` is `false` all authentication routes are unavailable.

### `AUTH_LOCAL_USERS_ENABLED`

Default value: `true`

Enables users to register and login using email and password or magiclink.

### `CHANGE_EMAIL_ENABLED`

Default value: `true`

Enables users to change their own email.

### `NOTIFY_EMAIL_CHANGE`

Default value: `false`

Send a transactional notification email to a user if their email was changed.

### `ANONYMOUS_USERS_ENABLED`

Default value: `false`

Enables users to register as an anonymous user. (TODO: I don't think this is fully implemented. Possibly this option and feature should be removed).

### `ALLOW_USER_SELF_DELETE`

Default value: `false`

Enables users to delete their own account.

### `VERIFY_EMAILS`

Default value: `false`

If this option is `true` a user must verify a new email when they try to change their email. They verify the new email by receiving an email, sent by Hasura Backend plus, and clicking on the link in the email.

If this option is `false` a user can change their email without having to verify the new email.

### `LOST_PASSWORD_ENABLED`

Default value: `false`

Enables users to reset their password if they forgot it.

### `USER_IMPERSONATION_ENABLED`

Default value: `false`

Use the Admin Secret (TODO: ref link) to bypass password login restrictions so you can login as any user.

### `MAGIC_LINK_ENABLED`

Default value: `false`

Enables users to register and login using a Magic Link.

## Registration

### `ALLOWED_EMAIL_DOMAINS`

Default value: `` (allow all email domains)

Comma separated list of email domains that are allowed to register.

**Example**

If `ALLOWED_EMAIL_DOMAINS` is `tesla.com,ikea.se`, only emails from tesla.com and ikea.se would be allowed to register an account.

### `DEFAULT_USER_ROLE`

Default value: `user`

Default user role for registered users.

### `DEFAULT_ANONYMOUS_ROLE`

Default value: `anonymous`

Default user role for anonymous users.

### `AUTO_ACTIVATE_NEW_USERS`

Default value: `true`

If this value is `true` users are automatically activated and can login without verifying their email.

If this value is `false` users must verify their email by clicking the link in the account activation email that is sent out automatically on registration.

### `HIBP_ENABLED`

Default value: `false`

User's password is checked against [Pwned Passwords](https://haveibeenpwned.com/Passwords).

### `REGISTRATION_CUSTOM_FIELDS`

Let user add data on registration.

**Example**

If `REGISTRATION_CUSTOM_FIELDS` is `display_name` the user can set their own value in `public.users.display_name` on registration.

### `MIN_PASSWORD_LENGTH`

Default value: `3`

Minimum password lenght.

### `DEFAULT_ALLOWED_USER_ROLES`

Default value: [`DEFAULT_USER_ROLES`](#default_user_role)

Comma separated list of default allowed user roles.

### `ALLOWED_USER_ROLES`

Default value: [`DEFAULT_ALLOWED_USER_ROLES``](#default_allowed_user_roles)

Comma separated list of allowed user roles a user can select on registration. If no roles are selected, the user will get the roles from `DEFAULT_ALLOWED_USER_ROLES`.

## Storage

### `STORAGE_ENABLED`

Default value: `true`

Enables all storage routes.

### `S3_SSL_ENABLED`

Default value: `true`

Enables SSL connection to S3.

### `S3_BUCKET`

S3 bucket to save all files in.

### `S3_ENDPOINT`

S3 endpoint.

### `S3_ACCESS_KEY_ID`

S3 access ID

### `S3_SECRET_ACCESS_KEY`

S3 secret access key.

## Application

### `SERVER_URL`

Server URL of where Hasura Backend Plus is running. This value is used as a variable in email templates and for generating callback urls for OAuth providers.

### `REDIRECT_URL_ERROR`

Redirect URL on error. Used for redirecting the user back to your app on when activating an account, using an OAuth provider, magic link etc.

### `REDIRECT_URL_SUCCESS`

Redirect URL on success. Used for redirecting the user back to your app on when activating an account, using an OAuth provider, magic link etc.

### `HASURA_GRAPHQL_ADMIN_SECRET`

Hasura GraphQL Admin Secret.

### `HASURA_ENDPOINT`

Hasura GraphQL endpoint.

### `PORT`

Server port. [Docs](http://expressjs.com/en/5x/api.html#app.listen)

### `HOST`

Server host. [Docs](http://expressjs.com/en/5x/api.html#app.listen)

### `MAX_REQUESTS`

Default value: `1000`

Rate limit: A Maximum number of requests that a user can do within a the given `TIME_FRAME` before returning [`429`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429) http status code.

### `TIME_FRAME`

Default value: `900000` (15 minutes)

Rate limit: Time frame (in millisseconds).

## Email

### `EMAILS_ENABLED`

Default value: `false`

Enables transactional email (ex. activation email, magic link email etc) to be sent from Hasura Backend Plus.

### `SMTP_HOST`

SMTP hostname.

### `SMTP_PORT`

Default value: `587`

SMTP port.

### `SMTP_USER`

SMTP username.

### `SMTP_PASS`

SMTP password.

### `SMTP_SENDER`

SMTP sender (email).

### `SMTP_AUTH_METHOD`

Default value: `PLAIN`

SMTP authentication method.

### `SMTP_SECURE`

Default value: `true`

[More info](https://nodemailer.com/smtp/#tls-options).

## JWT

### `JWT_KEY`

JWT key.

Recommended: `some-long-random-string-uh8ga7sgd8asgd7asgd89asijduyvtasfd789ujioasdubvtf76a8ys9udiojuauvytdf768aud`

### `JWT_ALGORITHM`

JWT Algorithm.

Can be one of: `RS256`, `RS384`, `RS512`, `HS256`, `HS384`, `HS512`.

Recommended: `HS512`

### `JWT_CLAIMS_NAMESPACE`

Default value: `https://hasura.io/jwt/claims`

Hasura claims namespace. More info on [Hasura's docs](https://hasura.io/docs/latest/graphql/core/auth/authentication/jwt.html#claims-namespace).

### `JWT_EXPIRES_IN`

Default value: `15`

Minutes until JWT tokens expires.

### `JWT_REFRESH_EXPIRES_IN`

Default value: `43200` (30 days)

Minutes until refresh token expires.

### `JWT_CUSTOM_FIELDS`

Comma separated list of custom fields form the `public.users` table to include as [session variables](https://hasura.io/docs/latest/graphql/core/auth/authorization/roles-variables.html#dynamic-session-variables) in the JWT token.

**Example**

If `JWT_CUSTOM_FIELDS` is `company_id` and there is a column `company_id` on the `public.users` table, indicating what company the user belongs to, the JWT token will add the `company_id` value to the JWT token as a `x-hasura-company-id` session variable:

```json
{
  "https://hasura.io/jwt/claims": {
    "x-hasura-user-id": "c8ee8353-1234-4530-9089-631ea7fd4c8a",
    "x-hasura-allowed-roles": ["me", "user"],
    "x-hasura-default-role": "user",
    "x-hasura-company-id": "1337" <------ This session variable is added!
  },
  "sub": "c8ee8353-b886-1234-9089-631ea7fd4c8a",
  "iss": "nhost",
  "iat": 1626324283,
  "exp": 1626325183
}
```

## Multi Factor Authentication

### `MFA_ENABLED`

Enables users to use Multi Factor Authentication

### `OTP_ISSUER`

Default value: `HBP`

The name of the One Time Password (OTP) issuer. Probably your app's name.

## Cookies

### `COOKIE_SECRET`

### `COOKIE_SECURE`

### `COOKIE_SAME_SITE`

Default value: `lax`

Can be one of: `lax`, `strict`, `none`.

## Google (OAuth)

### `GOOGLE_ENABLED`

Enables Google as OAuth provider.

### `GOOGLE_CLIENT_ID`

Google client ID.

### `GOOGLE_CLIENT_SECRET`

Google client secret.

## GitHub (OAuth)

### `GITHUB_ENABLED`

Enables GitHub as OAuth provider.

### `GITHUB_CLIENT_ID`

GitHub client ID.

### `GITHUB_CLIENT_SECRET`

GitHub client secret.

### `GITHUB_AUTHORIZATION_URL`

_optional_

For GitHub Enterprise: GitHub authorization URL.

### `GITHUB_TOKEN_URL`

_optional_

For GitHub Enterprise: GitHub token URL.

### `GITHUB_USER_PROFILE_URL`

_optional_

For GitHub Enterprise: GitHub user profile URL.

## Facebook (OAuth)

### `FACEBOOK_ENABLED`

Enables Facebook as OAuth provider.

### `FACEBOOK_CLIENT_ID`

Facebook client ID.

### `FACEBOOK_CLIENT_SECRET`

Facebook client secret.

## Twitter (OAuth)

### `TWITTER_ENABLED`

Enables Twitter as OAuth provider.

### `TWITTER_CONSUMER_KEY`

Twitter consumer key.

### `TWITTER_CONSUMER_SECRET`

Twitter consumer secret.

## LinkedIn (OAuth)

### `LINKEDIN_ENABLED`

Enables LinkedIn as OAuth provider.

### `LINKEDIN_CLIENT_ID`

LinkedIn client ID.

### `LINKEDIN_CLIENT_SECRET`

LinkedIn client secret.

## Apple (OAuth)

### `APPLE_ENABLED`

Enables Apple as OAuth provider.

### `APPLE_CLIENT_ID`

Apple client ID.

### `APPLE_TEAM_ID`

Apple team ID.

### `APPLE_KEY_ID`

Apple key ID.

### `APPLE_PRIVATE_KEY`

Apple key ID.

## Windows Live (OAuth)

### `WINDOWSLIVE_ENABLED`

Enables Windows Live as OAuth provider.

### `WINDOWSLIVE_CLIENT_ID`

Windows Live client ID.

### `WINDOWSLIVE_CLIENT_SECRET`

Windows Live client secret.

## Spotify (OAuth)

### `SPOTIFY_ENABLED`

Enables Spotify as OAuth provider.

### `SPOTIFY_CLIENT_ID`

Spotify client ID.

### `SPOTIFY_CLIENT_SECRET`

Spotify client secret.
