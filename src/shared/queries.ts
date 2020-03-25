import gql from 'graphql-tag'

export const insertUser = gql`
  mutation($user: users_insert_input!) {
    insert_users(objects: [$user]) {
      affected_rows
    }
  }
`

export const updatePasswordWithTicket = gql`
  mutation($now: timestamptz!, $ticket: uuid!, $password_hash: String!, $new_ticket: uuid!) {
    update_private_user_accounts(
      where: {
        _and: [
          { user: { ticket: { _eq: $ticket } } }
          { user: { ticket_expires_at: { _lt: $now } } }
        ]
      }
      _set: { password_hash: $password_hash }
    ) {
      affected_rows
    }
    update_users(
      where: { _and: [{ ticket: { _eq: $ticket } }, { ticket_expires_at: { _lt: $now } }] }
      _set: { ticket: $new_ticket, ticket_expires_at: $now }
    ) {
      affected_rows
    }
  }
`

export const updatePasswordWithUserId = gql`
  mutation($user_id: uuid!, $password_hash: String!) {
    update_private_user_accounts(
      where: { user_id: { _eq: $user_id } }
      _set: { password_hash: $password_hash }
    ) {
      affected_rows
    }
  }
`

const userFragment = gql`
  fragment userFragment on users {
    id
    active
    default_role
    roles {
      role
    }
    is_anonymous
  }
`

export const selectUserById = gql`
  query($user_id: uuid!) {
    private_user_accounts(where: { user_id: { _eq: $user_id } }) {
      otp_secret
      mfa_enabled
      password_hash
      user {
        ...userFragment
        ticket
      }
    }
  }
  ${userFragment}
`

export const selectUserByEmail = gql`
  query($email: String!) {
    auth_accounts(where: { email: { _eq: $email } }) {
      otp_secret
      mfa_enabled
      password_hash
      ticket
      user {
        id
      }
    }
  }
  ${userFragment}
`

export const selectUserByUsername = gql`
  query($username: String!) {
    private_user_accounts(where: { username: { _eq: $username } }) {
      otp_secret
      mfa_enabled
      password_hash
      user {
        ...userFragment
        ticket
      }
    }
  }
  ${userFragment}
`

export const selectUserByTicket = gql`
  query($ticket: uuid!) {
    private_user_accounts(where: { user: { ticket: { _eq: $ticket } } }) {
      otp_secret
      mfa_enabled
      password_hash
      user {
        ...userFragment
        ticket
      }
    }
  }
  ${userFragment}
`

export const insertRefreshToken = gql`
  mutation($refresh_token_data: private_refresh_tokens_insert_input!) {
    insert_private_refresh_tokens(objects: [$refresh_token_data]) {
      affected_rows
    }
  }
`

export const selectRefreshToken = gql`
  query($refresh_token: uuid!, $current_timestamp: timestamptz!) {
    private_refresh_tokens(
      where: {
        _and: [
          { refresh_token: { _eq: $refresh_token } }
          { user: { active: { _eq: true } } }
          { expires_at: { _gte: $current_timestamp } }
        ]
      }
    ) {
      user {
        ...userFragment
      }
    }
  }
  ${userFragment}
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

export const deleteAllUsersRefreshTokens = gql`
  mutation($user_id: uuid!) {
    delete_private_refresh_tokens(where: { user_id: { _eq: $user_id } }) {
      affected_rows
    }
  }
`

export const activateAccount = gql`
  mutation (
    $ticket: uuid!,
    $new_ticket: uuid!,
    $now: timestamptz!
  ) {
     update_auth_accounts (
      where: {
        _and: { active: { _eq: false }, ticket: { _eq: $ticket }, ticket_expires_at: { _lt: $now } }
      }
      _set: { active: true, ticket: $new_ticket }
    ) {
      affected_rows
    }
  }
`

export const updateOtpSecret = gql`
  mutation($user_id: uuid!, $otp_secret: String!) {
    update_private_user_accounts(
      where: { user_id: { _eq: $user_id } }
      _set: { otp_secret: $otp_secret }
    ) {
      affected_rows
    }
  }
`

export const deleteOtpSecret = gql`
  mutation($user_id: uuid!) {
    update_private_user_accounts(
      where: { user_id: { _eq: $user_id } }
      _set: { otp_secret: null, mfa_enabled: false }
    ) {
      affected_rows
    }
  }
`

export const updateOtpStatus = gql`
  mutation($user_id: uuid!, $mfa_enabled: Boolean!) {
    update_private_user_accounts(
      where: { user_id: { _eq: $user_id } }
      _set: { mfa_enabled: $mfa_enabled }
    ) {
      affected_rows
    }
  }
`

export const rotateTicket = gql`
  mutation($ticket: uuid!, $new_ticket: uuid!, $now: timestamptz!) {
    update_users(
      where: { _and: { ticket: { _eq: $ticket }, ticket_expires_at: { _lt: $now } } }
      _set: { ticket: $new_ticket }
    ) {
      affected_rows
    }
  }
`

export const deleteUserById = gql`
  mutation($user_id: uuid) {
    delete_private_user_accounts(where: { user_id: { _eq: $user_id } }) {
      affected_rows
    }
    delete_private_refresh_tokens(where: { user_id: { _eq: $user_id } }) {
      affected_rows
    }
    delete_users(where: { id: { _eq: $user_id } }) {
      affected_rows
    }
  }
`

export const changeEmailByTicket = gql`
  mutation($now: timestamptz, $ticket: uuid!, $new_email: String!) {
    update_users(
      where: { _and: [{ ticket: { _eq: $ticket } }, { ticket_expires_at: { _lt: $now } }] }
      _set: { email: $new_email }
    ) {
      affected_rows
    }
  }
`

export const saveNewEmail = gql`
  mutation($email: String!, $new_email: String!) {
    update_users(where: { email: { _eq: $email } }, _set: { new_email: $new_email }) {
      affected_rows
    }
  }
`

export const getNewEmailByTicket = gql`
  query($ticket: uuid!) {
    users(where: { ticket: { _eq: $ticket } }) {
      new_email
    }
  }
`
