# Using Hasura Backend Plus with Nuxt

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
