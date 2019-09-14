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

You will need to add `/store/index.js` (it can be a blank page) in order to activate the Vuex store. The auth module uses Vuex for storing tokens and user data.

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

## Subscriptions

In order to get subscriptions to work, you need to add a plugin, and slightly modify the `nuxt.config.js` file. This is because the Apollo module does not add the JWT by default.

`/plugins/apollo.js`

```js
export default context => {
  const client = context.app.apolloProvider.defaultClient
  const token = context.app.$apolloHelpers.getToken()

  client.wsClient.connectionParams = () => {
    return {
      headers: {
        Authorization: token || '',
      },
    }
  }
}
```

Then add the following properties to `nuxt.config.js`, inserting the plugin and add the websocket URL to enable websockets:

```js
export default {
  apollo: {
    clientConfigs: {
      default: {
        wsEndpoint: '', // Generally same as the graphql link, with 'wss://' protocol
      },
    },
  },
  
  plugins: [
    {
      src: '~plugins/apollo.js',
      mode: 'client',
    },
  ],
}
```

You can now use subscriptions as per [the subscription docs](https://vue-apollo.netlify.com/guide/apollo/subscriptions.html#simple-subscription).
