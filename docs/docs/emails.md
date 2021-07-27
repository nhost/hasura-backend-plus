---
title: Emails
---

Hasura Backend Plus can send transactional emails based that are normally used for authentication.

[`EMAILS_ENABLED`](/docs/environment-variables#emails_enabled) must be `true` for emails to work.

## Activate Account

The **Activate Account** email is sent to newly registered users if [`AUTO_ACTIVATE_NEW_USERS`](/docs/environment-variables#auto_activate_new_users) is `false`.

Folder: `/custom/emails/activate-account/`

### Change Email

The **Change Email** email is sent to a user requesting to change email if [`VERIFY_EMAILS`](/docs/environment-variables#verify_emails) is `true`.

Folder: `/custom/emails/change-email/`

### Lost Password

The **Lost Password** email is sent to a user requesting to set a new password if [`LOST_PASSWORD_ENABLED`](/docs/environment-variables#lost_password_enabled) is `true`.

Folder: `/custom/emails/lost-password/`

### Magic Link

The **Magic Link** email is sent to a user who register or login using the Magic Link login method if [`MAGIC_LINK_ENABLED`](/docs/environment-variables#magic_link_enabled) is `true`.

Folder: `/custom/emails/magic-link/`

### Notify Email Change

The **Notify Email Change** email is sent if a user change their email if [`NOTIFY_EMAIL_CHANGE`](/docs/environment-variables#notify_email_change) is `true`.

Folder: `/custom/emails/notify-email-change/`

## SMTP Settings

Sett all SMTP settings via [environment variables](/docs/environment-variables#email).
