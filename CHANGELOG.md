# Hasura Backend Plus

## Next release

### Bug fixes and improvements

(Add entries here in the order of: server, docs, others)

- server: Updated change password routes for concistency with change email (#235)
- server: Added `AUTH_LOCAL_USERS_ENABLE` env variable to enable local (email/pw) users to register and login
- docs: Added API documentation (#235)
- other: Added CHANGELOG.md file (#235)
- refactor(auth): change token endpoint from HTTP POST to GET
- ci(docs): trigger publish docs when changes are done to the examples directory
- docs(auth): login, mfa, jwt
