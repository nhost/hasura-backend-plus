# Storage Rules

File authorization is tricky to manage, and means developers need to spend a lot of time on authentication and authorization. Using Hasura Backend Plus means all this complex code is done for you! All you need to do is set out file access rules, which makes creating and updating rules easy to manage.

The rules are set in a `yaml` file, and let you control granular access to files and folders. Hasura Backend Plus comes with a [template set of rules](https://github.com/nhost/hasura-backend-plus/blob/master/custom/storage-rules/rules.yaml), which you may need to change for your project.

``` yaml
functions:
  isAuthenticated: 'return !!request.auth'
  isOwner: "return !!request.auth && userId === request.auth['user-id']"
  validToken: 'return request.query.token === resource.Metadata.token'
paths:
  /user/:userId/:
    list: 'isOwner(userId)'
  /user/:userId/:fileId:
    read: 'isOwner(userId) || validToken()'
    write: 'isOwner(userId)'
```

In the permission variables cookie returned by the [login](../api.md#login) or [refresh](../api.md#refresh-token) endpoints.

This is a URL-encoded string, in the following template:

``` txt
s:<request.auth>.<checksum>
```

The `request.auth` part is a JSON object, which is the same as the [Hasura permission variables](https://hasura.io/docs/1.0/graphql/manual/auth/authentication/index.html#overview) but with the `x-hasura-` prefix removed:

``` json
{
  "user-id": "73f5d02c-484a-4003-98e4-bad5c6001882",
  "allowed-roles": [
    "user"
  ],
  "default-role": "user"
}
```

You can use the `request.auth` variables in your storage rule functions.

## Paths

Paths allow you to define where your files are, and what permissions should apply to them. You can have dynamic paths and static paths.

Dynamic paths can be used as variables within functions.

### Folder paths

Folder paths

``` yaml
paths:
  /user/:userId/files/:
    # Rules
```

**Note the trailing slash**. This is how you define folder paths.

You can use this to add permissions to listing files in a directory or downloading a `.zip` file of all the files.

### File paths

File paths define rules for the individual files within your storage.

``` yaml
paths:
  /user/:userId/files/:fileId:
    # Rules
```

Here, the `/user` and `/files` parts are static paths. The `:userId` and `:fileId` parts are dynamic paths.

Here's an example path that would be validated by this rule:

``` txt
/user/1/files/image.png
```

## Rules

You can specify the following rules in your `rules.yaml` file.

- create: upload a file and set metadata
- update: update the file and patch metadata
- get: return the file
- list: return a zip file with all the permitted files with a key starting with /custom-path/
- delete: delete the file

For simple allow/deny, you can return boolean values. This should be a simple javascript expression in a string.

For any complex permissions using variables, you should use [functions](#functions)

``` yaml
paths:
  /public:
    list: 'return true'
  /private:
    list: 'return false'
```

### File tokens

Files are uploaded with a token within their metadata. This will mean that files are visible without authentication, if the file token is passed in as a query parameter.

You can access query parameters on the `request` object:

``` yaml
functions:
  validToken: 'return request.query.token === resource.Metadata.token'
```

You can now use the `validToken` function to allow anyone to see the file with the correct token:

``` yaml
functions:
  validToken: 'return request.query.token === resource.Metadata.token'
paths:
  /private/:fileId:
    list: 'return false'
    read: 'validToken()'
```

The following URL will work for a file called `image.jpg` that has a token of `04f1449d-e567-44c9-a5b8-0f21b2eaa261`:

``` txt
/storage/o/private/image.jpg?token=04f1449d-e567-44c9-a5b8-0f21b2eaa261
```

## Functions

> Please note, it is not possible to call functions inside other functions

Functions allow you to define permissions which can be used by any rules. You can access the `permission_variables` cookie here, as `request.auth`.

For example, if you would like to allow users to access files within a folder named as their user id, you can add the following function:

``` yaml
functions:
  isOwner: '!!request.auth && request.auth["user-id"] === userId'
```

This function uses a variable, called `userId`, which must be passed in by the rule from a [dynamic path](#folder-paths):

``` yaml
functions:
  isOwner: '!!request.auth && request.auth["user-id"] === userId'
paths:
  /:userId/:
    list: isOwner(userId)
  /:userId/:fileId:
    read: isOwner(userId)
```

This will allow users to list their own file directory, and read their own files.

## Adding variables

Say you have many users that belong to different companies. You need to allow users to see files belonging to their own company, but not files belonging to other companies.

You will need a `company_id` column on your `users` table, and from this we can add appropriate permissions.

First, you need to add this column to the authentication permission variables, so that the `request.auth` now contains this variable.

``` json
{
  "user-id": "73f5d02c-484a-4003-98e4-bad5c6001882",
  "allowed-roles": [
    "user"
  ],
  "default-role": "user",
  "company-id": "e04567bf-884d-46f0-898e-bac1a260e128"
}
```

Now, you can add the following functions to your `rules.yaml`:

``` yaml
functions:
  employedBy: "return !!request.auth && request.auth['company-id'] === companyId"
paths:
  /:companyId/:
    list: "employedBy(companyId)"
  /:companyId/:fileId:
    read: 'employedBy(companyId) && validToken()'
    write: 'employedBy(companyId)'
```

How does this work? The `:companyId` path creates a variable called `companyId`, which can be passed into a function.
This gets passed into the `employedBy()` function, (called `companyId`), and can be compared to `request.auth['company-id']` from the `permission_variables` cookie.
