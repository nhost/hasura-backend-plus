auth (refresh token)

# routes

## general

/refresh-token
/user

## local
- /auth/local/register
- /auth/local/login
- /auth/local/new-password
- /auth/local/activate-account

# providers
- /auth/[provider]
- /auth/[provider]/callback


# database

## users
users
- id (uuid)
- display_name (text)
- email (text)
- avatar_url (text)
- default_role (text)
- active (bool)

## user_accounts
- id (uuid)
- user_id (uuid) FK
- username (text)
- email (text)
- password (text)
- secret_token (uuid)
- secret_token_expires_at (timestamptz)
- register_data (jsonb)

## user_providers
- id (uuid) PK
- user_id (uuid) FK
- provider (text) ENUM
- token (text)
- raw_json  (jsonb) MAYBE

## providers
- name (text) PK






# login scenarios

- Signup
- Login
- User is already logged in
-
