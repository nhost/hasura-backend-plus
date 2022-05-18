import { JWT } from './config'
import gql from 'graphql-tag'

const accountFragment = gql`
  fragment accountFragment on auth_accounts {
    active
    default_role
    email
    id
    is_anonymous
    mfa_enabled
    new_email
    otp_secret
    password_hash
    phone_number
    sms_mfa_enabled
    sms_otp_secret
    ticket
    account_roles {
      role
    }
    user {
      id
      display_name
      username
      ${JWT.CUSTOM_FIELDS.join('\n\t\t\t')}
    }
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

export const trackUserSignUp = gql`
  mutation trackUserSignUp($signupType: String!, $userId: String!, $email: String!) {
    trackUserSignUp(arg1: {signupType: $signupType, userId: $userId, email: $email}) {
      message
      status
    }
  }
`

export const mutateAccountTicket = gql`
  mutation($id: uuid!, $ticket: uuid!, $ticket_expires_at: timestamptz!) {
    update_auth_accounts_by_pk(
      pk_columns: { id: $id }
      _set: { ticket: $ticket, ticket_expires_at: $ticket_expires_at }
    ) {
      ticket
      user {
        display_name
      }
    }
  }
`

export const insertAccountProviderToUser = gql`
  mutation($account_provider: auth_account_providers_insert_input!, $account_id: uuid!) {
    insert_auth_account_providers_one(object: $account_provider) {
      account {
        ...accountFragment
      }
    }
    update_auth_accounts(_set: { active: true }, where: { id: { _eq: $account_id } }) {
      affected_rows
    }
  }
  ${accountFragment}
`

export const updateAccountProviderToUser = gql`
  mutation ($auth_provider_unique_id: String!, $provider: String!, $account_provider: auth_account_providers_set_input) {
    update_auth_account_providers(where: {auth_provider_unique_id: {_eq: $auth_provider_unique_id}, auth_provider: {_eq: $provider}}, _set: $account_provider) {
      returning {
        account {
          ...accountFragment
        }
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
  query($ticket: uuid!, $now: timestamptz!) {
    auth_accounts(
      where: { _and: [{ ticket: { _eq: $ticket } }, { ticket_expires_at: { _gt: $now } }] }
    ) {
      ...accountFragment
    }
  }
  ${accountFragment}
`

export const selectUserByUsername = gql`
  query($username: String = "") {
    users(where: { username: { _eq: $username } }) {
      username
    }
  }
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

export const accountOfRefreshToken = gql`
  query($refresh_token: uuid!) {
    auth_refresh_tokens(where: { _and: [{ refresh_token: { _eq: $refresh_token } }] }) {
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
      returning {
        id
      }
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

export const updateSmsOtpSecretAndPhoneNumber = gql`
  mutation($user_id: uuid!, $sms_otp_secret: String!, $phone_number: String!) {
    update_auth_accounts(
      where: { user: { id: { _eq: $user_id } } }
      _set: { sms_otp_secret: $sms_otp_secret, phone_number: $phone_number }
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

export const deleteSmsOtpSecret = gql`
  mutation($user_id: uuid!) {
    update_auth_accounts(
      where: { user: { id: { _eq: $user_id } } }
      _set: { sms_otp_secret: null, sms_mfa_enabled: false }
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

export const updateSmsMfaEnabled = gql`
  mutation($user_id: uuid!, $sms_mfa_enabled: Boolean!) {
    update_auth_accounts(
      where: { user: { id: { _eq: $user_id } } }
      _set: { sms_mfa_enabled: $sms_mfa_enabled }
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
      returning {
        user {
          display_name
        }
      }
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

export const updateAccountByEmail = gql`
  mutation updateAccountByEmail($account_email: citext!, $account: auth_accounts_set_input!) {
    update_auth_accounts(where: { email: { _eq: $account_email } }, _set: $account) {
      affected_rows
    }
  }
`

export const insertArtistRoyaltyClaim = gql`
  mutation InsertArtistRoyaltyClaim(
    $object: artist_royalty_claims_insert_input!
  ) {
    insert_artist_royalty_claims_one(object: $object) {
      created_at
    }
  }
`
