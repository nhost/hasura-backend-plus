# Hasura Backend Plus

## Next release

## v2.1.0

- server: Added version endpoint
- build: multi-staged docker file (#274)
- build: reduction of the docker image from 617MB to 216MB (#291)
- server: Add `SameSite=None` header to mitigate future cross-site errors from Chrome (#294)
- server: Removed `X-Frame-Options` for GET storage requests.
- server: Return file key on upload
- server: add COOKIE_SECURE (default: true) and COOKIE_SAME_SITE (default: lax) environment variables

## v2.0.0

- build: Run HBP with node instead of ts-node for lower memory consumption
- server + docs: Set "HOST" default value to empty
- server: No cache on auth routes

## v2.0.0-rc.4

- server: Better default api rate limit values
- server: Added auth test
- server: Don't save original filename as metadata on s3 object
- server: Correct default value for `JWT_ALGORITHM`.
- server + docs: Added "HOST" environment variable (#253)

## v2.0.0-rc.3

- server: Added S3_SSL_ENABLED env var
- server: Added AUTH_LOCAL_USERS_ENABLE env variable to enable local (email/pw) users to register and login
- server: Added support for multiple default allowed user roles (#246)

## v2.0.0-rc.2

- server: Updated change password routes for concistency with change email (#235)
- docs: Added API documentation (#235)
- other: Added CHANGELOG.md file (#235)
- refactor(auth): change token endpoint from HTTP POST to GET
- ci(docs): trigger publish docs when changes are done to the examples directory
- docs(auth): login, mfa, jwt
- server: Added support for multiple default allowed user roles (#246)

## v2.0.0-rc.1

V2 is a complete rewrite of HBP with breaking changes and with different technical solutions than v1, but still solving the same problem: Authentication and Storage for Hasura.

100% Typescript
Two factor auth
Email support
Rate limits
Optional pw check agains Pwnd
Test coverages
More external providers (Github, Facebook, twitter, google, Apple, Linkedin, windowslive)
Better support for storage rules
password recovery via email
account activation via email
email change via confirmation email
auto-migration
documentation
