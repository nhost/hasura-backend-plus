import gql from 'graphql-tag'

export const insertUser = gql`
  mutation($user: users_insert_input!) {
    insert_users(objects: [$user]) {
      affected_rows
    }
  }
`

export const updatePassword = gql`
  mutation(
    $now: timestamptz!
    $secret_token: uuid!
    $password_hash: String!
    $new_secret_token: uuid!
  ) {
    update_private_user_accounts(
      where: {
        _and: [
          { user: { secret_token: { _eq: $secret_token } } }
          { user: { secret_token_expires_at: { _lt: $now } } }
        ]
      }
      _set: { password_hash: $password_hash }
    ) {
      affected_rows
    }
    update_users(
      where: {
        _and: [{ secret_token: { _eq: $secret_token } }, { secret_token_expires_at: { _lt: $now } }]
      }
      _set: { secret_token: $new_secret_token, secret_token_expires_at: $now }
    ) {
      affected_rows
    }
  }
`

export const selectUserByEmail = gql`
  query($email: String!) {
    private_user_accounts(where: { email: { _eq: $email } }) {
      password_hash
      user {
        id
        active
      }
    }
  }
`

export const selectUserByUsername = gql`
  query($username: String!) {
    private_user_accounts(where: { username: { _eq: $username } }) {
      password_hash
      user {
        id
        active
      }
    }
  }
`

export const insertRefreshToken = gql`
  mutation($refresh_token_data: private_refresh_tokens_insert_input!) {
    insert_private_refresh_tokens(objects: [$refresh_token_data]) {
      affected_rows
    }
  }
`

export const selectRefreshToken = gql`
  query($refresh_token: uuid!, $current_timestampz: timestamptz!) {
    private_refresh_tokens(
      where: {
        _and: [
          { refresh_token: { _eq: $refresh_token } }
          { user: { active: { _eq: true } } }
          { expires_at: { _gte: $current_timestampz } }
        ]
      }
    ) {
      user {
        id
        active
      }
    }
  }
`

export const updateRefreshToken = gql`
  mutation(
    $old_refresh_token: uuid!
    $new_refresh_token_data: private_refresh_tokens_insert_input!
  ) {
    delete_private_refresh_tokens(where: { refresh_token: { _eq: $old_refresh_token } }) {
      affected_rows
    }
    insert_private_refresh_tokens(objects: [$new_refresh_token_data]) {
      affected_rows
    }
  }
`

export const activateUser = gql`
  mutation($secret_token: uuid!, $new_secret_token: uuid!, $now: timestamptz!) {
    update_users(
      where: {
        _and: [
          { secret_token: { _eq: $secret_token } }
          { secret_token_expires_at: { _lt: $now } }
          { active: { _eq: false } }
        ]
      }
      _set: { active: true, secret_token: $new_secret_token }
    ) {
      affected_rows
    }
  }
`
