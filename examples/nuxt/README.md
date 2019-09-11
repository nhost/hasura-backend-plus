# Using Hasura Backend Plus with Nuxt

See a working example on Codesandbox:

[![Edit Nuxt + HBP](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/codesandbox-nuxt-hdm7q?fontsize=14&module=%2Fnuxt.config.js)

**Use [nhost.io](https://nhost.io) for zero-config HBP!**

> **Note:** The `@nuxtjs/auth` package does not currently support refresh/refetch tokens, which means you will have to keep logging in when the JWT token expires. This is being worked on by the Nuxt team ([Issue #361 on `nuxt-community/auth-module`](https://github.com/nuxt-community/auth-module/pull/361)).

## Dependencies

 - [`@nuxtjs/auth`](https://auth.nuxtjs.org)
 - [`@nuxtjs/apollo`](https://github.com/nuxt-community/apollo-module)
 
**Install:**
```bash
# npm

npm install @nuxtjs/auth @nuxtjs/apollo

# yarn

yarn add @nuxtjs/auth @nuxtjs/apollo
```

## Setup

`nuxt.config.js`:

```js
export default {
  modules: [
    '@nuxtjs/apollo',
    '@nuxtjs/auth',
  ],
  
  apollo: {
    tokenName: 'auth._token.local', // set by @nuxtjs/auth module
    authenticationType: '', // auth._token.local contains 'Bearer' prefix already
    clientConfigs: {
      default: {
        httpEndpoint: '', // insert your own graphql link
        httpLinkOptions: {
          includeExtensions: true,
        },
      },
    },
  },

  auth: {
    strategies: {
      local: {
        endpoints: {
          login: {
            url: '', // insert login link (https://backend-xxxxxxxx.nhost.io/auth/login)
            method: 'post',
            propertyName: 'jwt_token',
          },
          logout: false,
          user: {
            url: '', // insert user link (https://backend-xxxxxxxx.nhost.io/auth/user)
            method: 'get',
            propertyName: 'user',
          },
        },
      },
    },
  },
}
```

add the following to the default export on any page you wish to authenticate, as per [`@nuxtjs/auth` docs](https://auth.nuxtjs.org/guide/middleware.html):

```js
export default {
  middleware: ['auth'],
}
```

## Logging In

In order to login, you will need to create a page as per the [instructions from the `@nuxtjs/auth` module](https://auth.nuxtjs.org/schemes/local.html#usage). Here is a minimal example:

```html
<!-- /pages/login.vue -->

<template>
  <div>
    <p>
      <input v-model="username" placeholder="Username" type="text">
    </p>
    <p>
      <input v-model="password" placeholder="Password" type="password">
    </p>
    <p>
      <button @click="login()">Login</button>
    </p>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      username: '',
      password: '',
    }
  },
  methods: {
    async login() {
      try {
        await this.$auth.loginWith('local', {
          data: {
            username: this.username,
            password: this.password,
          },
        })
      } catch (err) {
        console.error(err)
      }
    },
  },
}
</script>
```

## Authenticating Pages

In order to make a page secure, you must add the [`auth` middleware](https://auth.nuxtjs.org/guide/middleware.html) to the default export.

```html
<script>
export default {
  // ...
  
  middleware: ['auth'], // You can also use `middlware: 'auth'`, but this way lets you add multiple middlewares.
}
</script>
```
