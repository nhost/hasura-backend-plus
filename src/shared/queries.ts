import { JWT_CUSTOM_FIELDS } from './config'
import gql from 'graphql-tag'

const accountFragment = gql`
  fragment accountFragment on auth_accounts {
    id
    active
    default_role
    account_roles {
      role
    }
    user {
      id
      ${JWT_CUSTOM_FIELDS.join('\n\t\t\t')}
    }
    is_anonymous
    ticket
    email
    new_email
    otp_secret
    mfa_enabled
    password_hash
  }
`

export const insertAccount = gql`
  mutation($account: auth_accounts_insert_input!) {
    insert_auth_accounts(objects: [$account]) {
      affected_rows
      returning {
        ...accountFragment
      }
    }
  }
  ${accountFragment}
`

export const setNewTicket = gql`
  mutation($ticket: uuid!, $ticket_expires_at: timestamptz!, $user_id: uuid!) {
    update_auth_accounts(
      _set: { ticket: $ticket, ticket_expires_at: $ticket_expires_at }
      where: { user: { id: { _eq: $user_id } } }
    ) {
      affected_rows
    }
  }
`

export const updatePasswordWithTicket = gql`
  mutation($now: timestamptz!, $ticket: uuid!, $password_hash: String!, $new_ticket: uuid!) {
    update_auth_accounts(
      where: { _and: [{ ticket: { _eq: $ticket } }, { ticket_expires_at: { _gt: $now } }] }
      _set: { password_hash: $password_hash, ticket: $new_ticket, ticket_expires_at: $now }
    ) {
      affected_rows
    }
  }
`

export const updatePasswordWithUserId = gql`
  mutation($user_id: uuid!, $password_hash: String!) {
    update_auth_accounts(
      where: { user: { id: { _eq: $user_id } } }
      _set: { password_hash: $password_hash }
    ) {
      affected_rows
    }
  }
`

export const selectAccountByUserId = gql`
  query($user_id: uuid!) {
    auth_accounts(where: { user: { id: { _eq: $user_id } } }) {
      ...accountFragment
    }
  }
  ${accountFragment}
`

export const selectAccountByEmail = gql`
  query($email: citext!) {
    auth_accounts(where: { email: { _eq: $email } }) {
      ...accountFragment
    }
  }
  ${accountFragment}
`

export const selectAccountByTicket = gql`
  query($ticket: uuid!) {
    auth_accounts(where: { ticket: { _eq: $ticket } }) {
      ...accountFragment
    }
  }
  ${accountFragment}
`

export const insertRefreshToken = gql`
  mutation($refresh_token_data: auth_refresh_tokens_insert_input!) {
    insert_auth_refresh_tokens_one(object: $refresh_token_data) {
      account {
        ...accountFragment
      }
    }
  }
  ${accountFragment}
`

export const selectRefreshToken = gql`
  query($refresh_token: uuid!, $current_timestamp: timestamptz!) {
    auth_refresh_tokens(
      where: {
        _and: [
          { refresh_token: { _eq: $refresh_token } }
          { account: { active: { _eq: true } } }
          { expires_at: { _gte: $current_timestamp } }
        ]
      }
    ) {
      account {
        ...accountFragment
      }
    }
  }
  ${accountFragment}
`

export const updateRefreshToken = gql`
  mutation($old_refresh_token: uuid!, $new_refresh_token_data: auth_refresh_tokens_insert_input!) {
    delete_auth_refresh_tokens(where: { refresh_token: { _eq: $old_refresh_token } }) {
      affected_rows
    }
    insert_auth_refresh_tokens(objects: [$new_refresh_token_data]) {
      affected_rows
    }
  }
`

export const deleteAllAccountRefreshTokens = gql`
  mutation($user_id: uuid!) {
    delete_auth_refresh_tokens(where: { account: { user: { id: { _eq: $user_id } } } }) {
      affected_rows
    }
  }
`

export const deleteRefreshToken = gql`
  mutation($refresh_token: uuid!) {
    delete_auth_refresh_tokens(where: { refresh_token: { _eq: $refresh_token } }) {
      affected_rows
    }
  }
`

export const activateAccount = gql`
  mutation($ticket: uuid!, $new_ticket: uuid!, $now: timestamptz!) {
    update_auth_accounts(
      where: {
        _and: { active: { _eq: false }, ticket: { _eq: $ticket }, ticket_expires_at: { _gt: $now } }
      }
      _set: { active: true, ticket: $new_ticket, ticket_expires_at: $now }
    ) {
      affected_rows
    }
  }
`

export const updateOtpSecret = gql`
  mutation($user_id: uuid!, $otp_secret: String!) {
    update_auth_accounts(
      where: { user: { id: { _eq: $user_id } } }
      _set: { otp_secret: $otp_secret }
    ) {
      affected_rows
    }
  }
`

export const deleteOtpSecret = gql`
  mutation($user_id: uuid!) {
    update_auth_accounts(
      where: { user: { id: { _eq: $user_id } } }
      _set: { otp_secret: null, mfa_enabled: false }
    ) {
      affected_rows
    }
  }
`

export const updateOtpStatus = gql`
  mutation($user_id: uuid!, $mfa_enabled: Boolean!) {
    update_auth_accounts(
      where: { user: { id: { _eq: $user_id } } }
      _set: { mfa_enabled: $mfa_enabled }
    ) {
      affected_rows
    }
  }
`

export const rotateTicket = gql`
  mutation($ticket: uuid!, $new_ticket: uuid!, $now: timestamptz!) {
    update_auth_accounts(
      where: { _and: { ticket: { _eq: $ticket }, ticket_expires_at: { _gt: $now } } }
      _set: { ticket: $new_ticket, ticket_expires_at: $now }
    ) {
      affected_rows
    }
  }
`

export const deleteAccountByUserId = gql`
  mutation($user_id: uuid) {
    delete_auth_accounts(where: { user: { id: { _eq: $user_id } } }) {
      affected_rows
    }
  }
`

export const changeEmailByTicket = gql`
  mutation($now: timestamptz, $ticket: uuid!, $new_email: citext, $new_ticket: uuid!) {
    update_auth_accounts(
      where: { _and: [{ ticket: { _eq: $ticket } }, { ticket_expires_at: { _gt: $now } }] }
      _set: { email: $new_email, new_email: null, ticket: $new_ticket, ticket_expires_at: $now }
    ) {
      affected_rows
    }
  }
`

export const changeEmailByUserId = gql`
  mutation($user_id: uuid!, $new_email: citext) {
    update_auth_accounts(
      where: { user: { id: { _eq: $user_id } } }
      _set: { email: $new_email, new_email: null }
    ) {
      affected_rows
    }
  }
`

export const setNewEmail = gql`
  mutation($user_id: uuid!, $new_email: citext!) {
    update_auth_accounts(
      where: { user: { id: { _eq: $user_id } } }
      _set: { new_email: $new_email }
    ) {
      affected_rows
    }
  }
`

export const selectAccountProvider = gql`
  query($provider: String!, $profile_id: String!) {
    auth_account_providers(
      where: {
        _and: [
          { auth_provider: { _eq: $provider } }
          { auth_provider_unique_id: { _eq: $profile_id } }
        ]
      }
    ) {
      account {
        ...accountFragment
      }
    }
  }
  ${accountFragment}
`
