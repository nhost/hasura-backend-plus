import gql from 'graphql-tag'
import { USER_CLAIMS_FIELDS } from './config'

export const insertAccount = gql`
  mutation($account: auth_accounts_insert_input!) {
    insert_auth_accounts(objects: [$account]) {
      affected_rows
    }
  }
`

export const updatePasswordWithTicket = gql`
  mutation($now: timestamptz!, $ticket: uuid!, $password_hash: String!, $new_ticket: uuid!) {
    update_auth_accounts(
      where: { _and: [{ ticket: { _eq: $ticket } }, { ticket_expires_at: { _lt: $now } }] }
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
      ${USER_CLAIMS_FIELDS.join('\n\t\t\t')}
    }
    is_anonymous
    ticket
    otp_secret
    mfa_enabled
    password_hash
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
  query($email: String!) {
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
    insert_auth_refresh_tokens(objects: [$refresh_token_data]) {
      affected_rows
    }
  }
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

export const activateAccount = gql`
  mutation($ticket: uuid!, $new_ticket: uuid!, $now: timestamptz!) {
    update_auth_accounts(
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
      where: { _and: { ticket: { _eq: $ticket }, ticket_expires_at: { _lt: $now } } }
      _set: { ticket: $new_ticket }
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
  mutation($now: timestamptz, $ticket: uuid!, $new_email: String!) {
    update_auth_accounts(
      where: { _and: [{ ticket: { _eq: $ticket } }, { ticket_expires_at: { _lt: $now } }] }
      _set: { email: $new_email }
    ) {
      affected_rows
    }
  }
`

export const saveNewEmail = gql`
  mutation($email: String!, $new_email: String!) {
    update_auth_accounts(where: { email: { _eq: $email } }, _set: { new_email: $new_email }) {
      affected_rows
    }
  }
`

export const getNewEmailByTicket = gql`
  query($ticket: uuid!) {
    auth_accounts(where: { ticket: { _eq: $ticket } }) {
      new_email
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
        user {
          id
        }
      }
    }
  }
`
