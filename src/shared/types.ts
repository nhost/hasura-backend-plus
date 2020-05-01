export type ClaimValueType =
  | string
  | string[]
  | number
  | number[]
  | RegExp
  | RegExp[]
  | boolean
  | boolean[]
  | null

/**
 * Claims interface.
 */
export interface Claims {
  'x-hasura-user-id': string
  'x-hasura-default-role': string
  'x-hasura-allowed-roles': string[]
  [key: string]: ClaimValueType
}

/**
 * Token interface.
 */
export type Token = {
  [key: string]: Claims
} & {
  exp: bigint
  iat: bigint
}

export interface UserData {
  [key: string]: ClaimValueType
  id: string
  email?: string
  display_name: string
  avatar_url?: string
}

export interface AccountData {
  id: string
  user: UserData
  active: boolean
  default_role: string
  account_roles: { role: string }[]
  is_anonymous: boolean
  ticket?: string
  otp_secret?: string
  mfa_enabled: boolean
  password_hash: string
  email: string
  new_email?: string
}

export interface QueryAccountData {
  auth_accounts: AccountData[]
}

export interface UpdateAccountData {
  update_auth_accounts: {
    affected_rows: number
    // AccountData[]
  }
}

export interface DeleteAccountData {
  delete_auth_accounts: { affected_rows: number }
}
interface AccountProvider {
  account: AccountData
}

export interface QueryAccountProviderData {
  auth_account_providers: AccountProvider[]
}

export interface InsertAccountData {
  insert_auth_accounts: {
    returning: AccountData[]
  }
}
