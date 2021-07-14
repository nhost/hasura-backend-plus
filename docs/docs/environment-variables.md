---
title: Environment Variables
---

## Authentication

### `AUTH_ENABLED`

Default Value: `true`

Enables users to use all authentication routes. If `AUTH-ENABLED` is `false` all authentication routes are unavailable.

### `AUTH_LOCAL_USERS_ENABLED`

Default Value: `true`

Enables users to register and login using email and password or magiclink.

### `CHANGE_EMAIL_ENABLED`

Default Value: `true`

Enables users to change their own email.

### `NOTIFY_EMAIL_CHANGE`

Default Value: `false`

Send a transactional notification email to a user if their email was changed.

### `ANONYMOUS_USERS_ENABLED`

Default Value: `false`

Enables users to register as an anonymous user. (TODO: I don't think this is fully implemented. Possibly this option and feature should be removed).

### `ALLOW_USER_SELF_DELETE`

Default Value: `false`

Enables users to delete their own account.

### `VERIFY_EMAILS`

Default Value: `false`

If this option is `true` a user must verify a new email when they try to change their email. They verify the new email by receiving an email, sent by Hasura Backend plus, and clicking on the link in the email.

If this option is `false` a user can change their email without having to verify the new email.

### `LOST_PASSWORD_ENABLED`

Default Value: `false`

Enables users to reset their password if they forgot it.

### `USER_IMPERSONATION_ENABLED`

Default Value: `false`

Use the Admin Secret (TODO: ref link) to bypass password login restrictions so you can login as any user.

### `MAGIC_LINK_ENABLED`

Default Value: `false`

Enables users to register and login using a Magic Link.

## Storage

### `STORAGE_ENABLED`

## Cookies

### `COOKIE_SECRET`

### `COOKIE_SECURE`

### `COOKIE_SAME_SITE`

Default Value: `lax`

Can be one of: `lax`, `strict`, `none`.
