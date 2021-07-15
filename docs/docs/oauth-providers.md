---
title: OAuth Providers
---

Hasura Backend Plus makes it easy to sign in users using external OAuth provides.

The following OAuth providers are supported:

- GitHub
- Google
- Facebook
- Apple
- Twitter
- LinkedIn
- Spotify
- Windows Live

When a user register using an OAuth provider Hasura Backend Plus creates the user and account in the local database.

`email`, `display_name` and `avatar_url` will automatically be used from the externa OAuth provider for the user in the database.
