# Configuration

## Custom Storage Rules

## OAuth Providers

## Custom User Schema

## Two-factor Authentication

## Checking Pwned Passwords

## Account activation emails

## Rate limiting

## Environment Variables

### General

| Name                          | Default | Description                                                                                                 |
| ----------------------------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| `HASURA_ENDPOINT` (required)  |         | Url of the Hasura GraphQL engine endpoint used by the backend to access the database.                       |
| `HASURA_GRAPHQL_ADMIN_SECRET` |         | The secret set in the Hasura GraphQL Engine to allow admin access to the service. **Strongly recommended**. |
| `PORT`                        | 3000    | Port of the service                                                                                         |
| `SERVER_URL`                  |         | Current server URL. Currently used only for creating links from email templates                             |
| `MAX_REQUESTS`                | 100     | Maximum requests per IP within the following `TIME_FRAME`.                                                  |
| `TIME_FRAME`                  | 900000  | Timeframe used to limit requests from the same IP, in milliseconds. Defaults to 15 minutes.                 |

### Authentication

| Name                                 | Default                 | Description                                                                                                                                                                                  |
| ------------------------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ALLOWED_EMAIL_DOMAINS`              |                         | List of comma-separated email domain names that are allowed to register.                                                                                                                     |
| `AUTO_ACTIVATE_USER_ON_REGISTRATION` | false                   | When set to true, automatically activate the users once registererd.                                                                                                                         |
| `COOKIE_SECRET`                      |                         |                                                                                                                                                                                              |
| `DEFAULT_USER_ROLE`                  | user                    |                                                                                                                                                                                              |
| `HIBP_ENABLED`                       | false                   |                                                                                                                                                                                              |
| `JWT_ALGORITHM`                      | RS256                   | Valid values: RS256, RS384, RS512, HS256, HS384, HS512                                                                                                                                       |
| `JWT_SECRET_KEY`                     |                         | Encryption secret. Required when using a SHA (RS*) algorithm. When using a RSA algorithm (RS*), should contain a valid RSA PEM key, otherwise `KEY_FILE_PATH` will be used.                  |
| `JWT_EXPIRES_IN`                     | 15                      |                                                                                                                                                                                              |
| `KEY_FILE_PATH`                      | custom/keys/private.pem | Path to the RSA PEM private key file when using a RSA (RS\*) algorithm and no `JWT_SECRET_KEY` is set. When used, will create a random key if the file is not found.                         |
| `MIN_PASSWORD_LENGTH`                | 3                       | Minimum allowed password length.                                                                                                                                                             |
| `REDIRECT_URL_ERROR`                 |                         |                                                                                                                                                                                              |
| `REDIRECT_URL_SUCCESS`               |                         |                                                                                                                                                                                              |
| `REFRESH_EXPIRES_IN`                 | 43200                   |                                                                                                                                                                                              |
| `SMTP_ENABLED`                       | false                   | When set to true, emails are sent on certain steps, like after registration for account activation when autoactivation is deactivated, or for changing emails or passwords                   |
| `SMTP_HOST`                          |                         | SMTP server path to use for sending emails.                                                                                                                                                  |
| `SMTP_PASS`                          |                         | Password to authenticate on the SMTP server.                                                                                                                                                 |
| `SMTP_USER`                          |                         | Username to authenticate on the SMTP server.                                                                                                                                                 |
| `SMTP_PORT`                          | 587                     | SMTP server port.                                                                                                                                                                            |
| `SMTP_SECURE`                        | false                   | Set to true when the SMTP uses SSL.                                                                                                                                                          |
| `USER_REGISTRATION_FIELDS`           |                         | Fields that need to be passed on to the registration patload, and that correspond to columns of the `public.users`table.                                                                     |
| `USER_CLAIMS_FIELDS`                 |                         | List of comma-separated column names from the `public.users` tables that will be added to the `https://hasura.io/jwt/claims`JWT claims. Column names are kebab-cased and prefixed with `x-`. |
| `OTP_ISSUER`                         | HBP                     | One-Time Password issuer name used with Muti-factor authentication.                                                                                                                          |

### Storage

| Name                   | Default | Description |
| ---------------------- | ------- | ----------- |
| `S3_ACCESS_KEY_ID`     |         |             |
| `S3_BUCKET`            |         |             |
| `S3_ENDPOINT`          |         |             |
| `S3_SECRET_ACCESS_KEY` |         |             |
