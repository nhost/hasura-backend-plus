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
| `MAX_REQUESTS`                | 100     | Maximum requests per IP within the following `TIME_FRAME`.                                                  |
| `TIME_FRAME`                  | 900000  | Timeframe used to limit requests from the same IP, in milliseconds. Defaults to 15 minutes.                 |

### Authentication

| Category     | Name                                 | Default | Description                                                                                                              |
| ------------ | ------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| Registration | `ALLOWED_EMAIL_DOMAINS`              |         | List of comma-separated email domain names that are allowed to register.                                                 |
| ^^           | `AUTO_ACTIVATE_USER_ON_REGISTRATION` | false   | When set to true, automatically activate the users once registererd.                                                     |
| ^^           | `DEFAULT_USER_ROLE`                  | user    |                                                                                                                          |
| ^^           | `USER_REGISTRATION_FIELDS`           |         | Fields that need to be passed on to the registration patload, and that correspond to columns of the `public.users`table. |
| Password     | `HIBP_ENABLED`                       | false   |                                                                                                                          |
| ^^           | `MIN_PASSWORD_LENGTH`                |         |                                                                                                                          |
| JWT          | `JWT_ALGORITHM`                      | RS256   |                                                                                                                          |
| ^^           | `JWT_SECRET_KEY`                     |         |                                                                                                                          |
| ^^           | `JWT_EXPIRES_IN`                     | 15      |                                                                                                                          |
| ^^           | `KEY_FILE_PATH`                      |         |                                                                                                                          |
| ^^           | `USER_CLAIMS_FIELDS`                 |         |                                                                                                                          |
| Emails       | `SMTP_ENABLED`                       | false   |                                                                                                                          |
| ^^           | `SMTP_PASS`                          |         |                                                                                                                          |
| ^^           | `SMTP_HOST`                          |         |                                                                                                                          |
| ^^           | `SMTP_USER`                          |         |                                                                                                                          |
| ^^           | `SMTP_PORT`                          | 587     |                                                                                                                          |
| ^^           | `SMTP_SECURE`                        | false   |                                                                                                                          |
| ^^           | `SERVER_URL`                         |         | Current server URL. Used for creating links in email templates                                                           |
| Other        | `REDIRECT_URL_ERROR`                 |         |                                                                                                                          |
| ^^           | `REDIRECT_URL_SUCCESS`               |         |                                                                                                                          |
| ^^           | `REFRESH_EXPIRES_IN`                 | 43200   |                                                                                                                          |
| ^^           | `COOKIE_SECRET`                      |         |                                                                                                                          |
| ^^           | `OTP_ISSUER`                         | HBP     |                                                                                                                          |

### Storage

| Name                   | Default | Description |
| ---------------------- | ------- | ----------- |
| `S3_ACCESS_KEY_ID`     |         |             |
| `S3_BUCKET`            |         |             |
| `S3_ENDPOINT`          |         |             |
| `S3_SECRET_ACCESS_KEY` |         |             |
