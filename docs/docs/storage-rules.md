---
title: Storage Rules
---

File authorization is tricky to manage, and means developers need to spend a lot of time on authentication and authorization. Using Hasura Backend Plus means all this complex code is done for you! All you need to do is set out file access rules, which makes creating and updating rules easy to manage.

The rules are set in a `yaml` file, and let you control granular access to files and folders. Hasura Backend Plus comes with a [rules template](https://github.com/nhost/hasura-backend-plus/blob/master/custom/storage-rules/rules.yaml), which you can change for your specific project:

```yaml
functions:
  isAuthenticated: "return !!request.auth"
  isOwner: "return !!request.auth && userId === request.auth['user-id']"
  validToken: "return request.query.token === resource.Metadata.token"
paths:
  /user/:userId/:
    list: "isOwner(userId)"
  /user/:userId/:fileId:
    read: "isOwner(userId) || validToken()"
    write: "isOwner(userId)"
```

The `yaml` file is split into the following sections:

- [Paths](#paths)
- [Storage functions](#storage-functions)

---

#### Paths

Paths allow you to define authorization permissions to your folders and files. This means you can control access to files, folders, and subfolders easily.

Paths can be static or dynamic, and dynamic paths can be used as variables within storage functions.

##### Folder paths

Folder paths

```yaml
paths:
  /user/:userId/files/:
    # Rules
```

**Note the trailing slash**. This is how you define folder paths.

You can use this to add permissions to listing files in a directory or downloading a `.zip` file of all the files.

##### File paths

File paths define rules for the individual files within your storage.

```yaml
paths:
  /user/:userId/files/:fileId:
    # Rules
```

Here, the `/user` and `/files` parts are static paths. The `:userId` and `:fileId` parts are dynamic paths.

Here's an example path that would be validated by this rule:

```txt
/user/1/files/image.png
```

#### Rules

You can specify the following rules in your `rules.yaml` file:

| Action           | Metadata (`/m/`)                  | Object (`/o/`)                        |
| ---------------- | --------------------------------- | ------------------------------------- |
| Folder: `create` | N/A                               | N/A                                   |
| Folder: `update` | N/A                               | N/A                                   |
| Folder: `list`   | Get metadata for accessible files | Get `.zip` folder of accessible files |
| Folder: `get`    | N/A                               | N/A                                   |
| Folder: `delete` | N/A                               | N/A                                   |
| &nbsp;           |                                   |                                       |
| File: `create`   | N/A                               | Create file                           |
| File: `update`   | Update metadata                   | Update file                           |
| File: `list`     | N/A                               | N/A                                   |
| File: `get`      | Get file metadata                 | Get file                              |
| File: `delete`   | N/A                               | Delete the file                       |

For simple allow/deny, you can return boolean values (`true`/`false`) in a string.

```yaml
paths:
  /public:
    list: "true"
  /private:
    list: "false"
```

For any complex permissions using variables, you should use [storage functions](#storage-functions).

##### File tokens

When you upload a file to Hasura Backend Plus, a token is automatically added to the file metadata. This is unique for the file, and can be used as an access token.
You can create a `validToken` storage function, and use that to allow access to the file, even if a user is unauthenticated.

We can define a rule to allow access to this image if the right token (in this case `c9aa7344-1b4c-42d2-81c0-48ee401a3eeb`) is present:

```txt
/storage/o/private/secret-image.jpg?token=c9aa7344-1b4c-42d2-81c0-48ee401a3eeb
```

The token is sent as a query parameter, which you can access on the `request` object. You can check the token against the `resource.Metadata.token` variable:

```yaml
functions:
  validToken: "return request.query.token === resource.Metadata.token"
```

You can now use the `validToken` storage function to allow anyone to see the file with the correct token:

```yaml
functions:
  validToken: "return request.query.token === resource.Metadata.token"
paths:
  /private/:fileId:
    read: "validToken()"
```

#### Storage functions

> It is not possible to call storage functions inside other functions

Storage functions allow you to define permissions which can be used by any rules. Storage functions have access to the query string of the request, and the permission variables cookie returned by the [login](/docs/api-reference#authlogin) or [refresh](/docs/api-reference#authtokenrefresh) endpoints.

You can have a look at the permission variables by examining the `permission_variables` cookie. This is a URL-encoded string, in the following template:

```txt
s:<request.auth>.<checksum>
```

The `request.auth` part is a JSON object, which is the same as the [Hasura permission variables](https://hasura.io/docs/1.0/graphql/manual/auth/authentication/index.html#overview) but with the `x-hasura-` prefix removed:

```json
{
  "user-id": "73f5d02c-484a-4003-98e4-bad5c6001882",
  "allowed-roles": ["user"],
  "default-role": "user"
}
```

You can access these variables through `request.auth` (for example `request.auth['default-role']`) when creating your storage rules.

A simple storage function would be to test if a user is authenticated. You can do this by checking if `request.auth` is present:

```yaml
functions:
  isAuthenticated: "return !!request.auth"
```

Now, you can use this storage function within a storage path:

```yaml
functions:
  isAuthenticated: 'return !!request.auth'
paths:
  /everyone/:
    list: 'isAuthenticated()
```

This will allow any logged-in user to access the files in the `/everyone/` directory. If someone isn't logged in, they won't be able to see them.

You can also add more complex rules. For example, if you would like to allow users to access files within a folder named as their user id, you can add the following storage function:

```yaml
functions:
  isOwner: 'return !!request.auth && request.auth["user-id"] === userId'
```

This function checks that a user is logged in, but also uses a variable called `userId`, which must be passed in by the rule from a [dynamic path](#folder-paths):

```yaml
functions:
  isOwner: 'return !!request.auth && request.auth["user-id"] === userId'
paths:
  /:userId/:
    list: "isOwner(userId)"
  /:userId/:fileId:
    read: "isOwner(userId)"
```

This rule will allow users to list their own file directory, and read their own files.

#### Adding variables

Say you have many users that belong to different companies. You need to allow users to see files belonging to their own company, but not files belonging to other companies.

You will need a `company_id` column on your `users` table, and from this we can add appropriate permissions.

First, you need to add this column to the authentication permission variables, so that the `request.auth` now contains this variable:

```json
{
  "user-id": "73f5d02c-484a-4003-98e4-bad5c6001882",
  "allowed-roles": ["user"],
  "default-role": "user",
  "company-id": "e04567bf-884d-46f0-898e-bac1a260e128"
}
```

Now, you can add the following storage functions to your `rules.yaml`:

```yaml
functions:
  employedBy: 'return !!request.auth && request.auth["company-id"] === companyId'
paths:
  /:companyId/:
    list: "employedBy(companyId)"
  /:companyId/:fileId:
    read: "employedBy(companyId) && validToken()"
    write: "employedBy(companyId)"
```

How does this work? The `:companyId` path creates a variable called `companyId`, which can be passed into a function.
This gets passed into the `employedBy()` function, (called `companyId`), and can be compared to `request.auth['company-id']` from the `permission_variables` cookie.
