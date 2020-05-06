# Configuration

## Registration

### Activate accounts

By default, accounts are automatically activated on registration. You may want to change this so you add a step to the registration process.

To deactivate autoactivation, set the environment variable `AUTO_ACTIVATE_NEW_USERS=false`

In addition to this, you can send a verification email with an activation link. You will then need to [configure the connection to a SMTP server](#enable-emails).

If SMTP is enabled, then the user will receive an email with an activation link. If the activation succeeds, the user is redirected to the url found in the `REDIRECT_URL_SUCCESS` environment variable. If it fails, they will redirected to the url given by the `REDIRECT_URL_ERROR` environment variable.

You can change the default email templates. In order to do so, you can mount [custom configuration files](#custom-configuration-files) when using docker, or change files in the [custom directory](https://github.com/nhost/hasura-backend-plus/tree/master/custom) when running HBP from the source code.
Other email templates are available and described [here](#email-templates)

### Limit email domains

You can limit registration to ranges of emails that are only part of a whitelist. For instance, you may want to limit registration only to the email addresses of your own organisation. You can pass a list of comma-separated email domains to the `ALLOWED_EMAIL_DOMAINS` environment variable, for instance:

```
ALLOWED_EMAIL_DOMAINS=gmail.com,yourorganisation.com
```

### Password constraints

By default, clients can register with a password of at least three characters. You can change this in setting a higher value:

```
MIN_PASSWORD_LENGTH=6
```

You can ask HBP to check on [Have I Been Pwned](https://haveibeenpwned.com/Passwords) if the password has been previously exposed in data breaches. If so, the registration will fail. This option is disabled by default.

```
HIBP_ENABLE=false
```

### Additional registration fields

You may want to extend the `public.users` table with your own fields and relations, and to expect the client to set some of them when registering. It is possible to set a list of columns in the `REGISTRATION_CUSTOM_FIELDS` environment value.

<!-- TODO link to the page on schema -->

Here is an example on the way to proceed to add a `nickname` value to the registration:

1. Add a column `nickname` of type text to the `public.users` table
2. Set the environment variable `REGISTRATION_CUSTOM_FIELDS=nickname`
3. The registration endpoint now expects a `nickname` value in addition to `email` and `password`

::: warning
Any given field must exist in the `users` GraphQL type that corresponds to the `public.users` PostgreSQL table, or registration will fail.
:::

<!-- TODO link to JWT custom claims -->

## Enable emails

## Custom configuration files

<!-- TODO explain the contents of the configuration files, and how to mount them with a docker volume -->

### Storage Rules

### Email templates

### Private key

## OAuth Providers

## Custom User Schema

## Two-factor Authentication

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

| Name                         | Default                 | Description                                                                                                                                                                                  |
| ---------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ALLOWED_EMAIL_DOMAINS`      |                         | List of comma-separated email domain names that are allowed to register.                                                                                                                     |
| `AUTO_ACTIVATE_NEW_USERS`    | false                   | When set to true, automatically activate the users once registererd.                                                                                                                         |
| `COOKIE_SECRET`              |                         |                                                                                                                                                                                              |
| `DEFAULT_USER_ROLE`          | user                    |                                                                                                                                                                                              |
| `HIBP_ENABLE`                | false                   |                                                                                                                                                                                              |
| `JWT_ALGORITHM`              | RS256                   | Valid values: RS256, RS384, RS512, HS256, HS384, HS512                                                                                                                                       |
| `JWT_KEY`                    |                         | Encryption secret. Required when using a SHA (RS*) algorithm. When using a RSA algorithm (RS*), should contain a valid RSA PEM key, otherwise `JWT_KEY_FILE_PATH` will be used.              |
| `JWT_EXPIRES_IN`             | 15                      |                                                                                                                                                                                              |
| `JWT_KEY_FILE_PATH`          | custom/keys/private.pem | Path to the RSA PEM private key file when using a RSA (RS\*) algorithm and no `JWT_KEY` is set. When used, will create a random key if the file is not found.                                |
| `MIN_PASSWORD_LENGTH`        | 3                       | Minimum allowed password length.                                                                                                                                                             |
| `REDIRECT_URL_ERROR`         |                         |                                                                                                                                                                                              |
| `REDIRECT_URL_SUCCESS`       |                         |                                                                                                                                                                                              |
| `JWT_REFRESH_EXPIRES_IN`     | 43200                   |                                                                                                                                                                                              |
| `SMTP_ENABLE`                | false                   | When set to true, emails are sent on certain steps, like after registration for account activation when autoactivation is deactivated, or for changing emails or passwords                   |
| `SMTP_HOST`                  |                         | SMTP server path to use for sending emails.                                                                                                                                                  |
| `SMTP_PASS`                  |                         | Password to authenticate on the SMTP server.                                                                                                                                                 |
| `SMTP_USER`                  |                         | Username to authenticate on the SMTP server.                                                                                                                                                 |
| `SMTP_PORT`                  | 587                     | SMTP server port.                                                                                                                                                                            |
| `SMTP_SECURE`                | false                   | Set to true when the SMTP uses SSL.                                                                                                                                                          |
| `REGISTRATION_CUSTOM_FIELDS` |                         | Fields that need to be passed on to the registration patload, and that correspond to columns of the `public.users`table.                                                                     |
| `JWT_CUSTOM_FIELDS`          |                         | List of comma-separated column names from the `public.users` tables that will be added to the `https://hasura.io/jwt/claims`JWT claims. Column names are kebab-cased and prefixed with `x-`. |
| `OTP_ISSUER`                 | HBP                     | One-Time Password issuer name used with Muti-factor authentication.                                                                                                                          |

### Storage

| Name                   | Default | Description |
| ---------------------- | ------- | ----------- |
| `S3_ACCESS_KEY_ID`     |         |             |
| `S3_BUCKET`            |         |             |
| `S3_ENDPOINT`          |         |             |
| `S3_SECRET_ACCESS_KEY` |         |             |
