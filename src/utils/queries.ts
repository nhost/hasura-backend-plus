/**
 * Create user account
 */
export const insertUser = `
  mutation($user: users_insert_input!) {
    insert_users(objects: [$user]) {
      affected_rows
    }
  }
`

/**
 * Update user password
 */
export const updatePassword = `
  mutation(
    $secret_token: uuid!
    $password_hash: String!
    $new_secret_token: uuid!
    $now: timestamptz!
  ) {
    update_auth_user_accounts(
      where: {
        _and: [
          { user: { secret_token: { _eq: $secret_token } } }
          { user: { secret_token_expires_at: { _lt: $now } } }
        ]
      }
      _set: { password: $password_hash }
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

/**
 * Query user account
 */
export const selectUser = `
  query($email: String!) {
    auth_user_accounts(where: { email: { _eq: $email } }) {
      password
      user {
        id
        active
        default_role
        user_roles {
          role
        }
      }
    }
  }
`

/**
 * Insert refresh token
 */
export const insertRefreshToken = `
  mutation($refresh_token_data: auth_refresh_tokens_insert_input!) {
    insert_auth_refresh_tokens(objects: [$refresh_token_data]) {
      affected_rows
    }
  }
`

/**
 * Query refresh token
 */
export const selectRefreshToken = `
  query get_refresh_token($refresh_token: uuid!, $current_timestampz: timestamptz!) {
    auth_refresh_tokens(
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
        default_role
        user_roles {
          role
        }
      }
    }
  }
`

/**
 * Update refresh token
 */
export const updateRefreshToken = `
  mutation($old_refresh_token: uuid!, $new_refresh_token_data: auth_refresh_tokens_insert_input!) {
    delete_auth_refresh_tokens(where: { refresh_token: { _eq: $old_refresh_token } }) {
      affected_rows
    }
    insert_auth_refresh_tokens(objects: [$new_refresh_token_data]) {
      affected_rows
    }
  }
`

/**
 * Activate user account
 */
export const activateUser = `
  mutation activate_account($secret_token: uuid!, $new_secret_token: uuid!, $now: timestamptz!) {
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
