---
title: Introduction
---

Hasura Backend Plus handles **authentication** and **storage** for [Hasura](https://github.com/hasura/graphql-engine).

Hasura Backend Plus runs in a separate Docker container along side Postgres and Hasura.

## Authentication

- Users and accounts are saved in the database.
- JWT tokens and refresh tokens are automatically generated and managed.
- Add custom user claims to the JWT token based on user data.
- Hasura roles managed.
- Two-factor authentication support.
- Third-party OAuth providers such as GitHub, Google, Facebook, Twitter etc.
- Magic Link support.
- Built in transactional emails such as account acitvation and password reset.
- Rate limiting.
- Optional checking for [Pwned Passwords](https://haveibeenpwned.com/Passwords).

## Storage

- Backed by S3 (Minio).
- Rules engine for file access permissions.
- Out of the box image transformation.
