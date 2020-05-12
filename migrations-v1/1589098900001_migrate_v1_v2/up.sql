
DROP TABLE auth.refresh_tokens;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE auth.account_providers (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    account_id uuid NOT NULL,
    auth_provider text NOT NULL,
    auth_provider_unique_id text NOT NULL
);
CREATE TABLE auth.account_roles (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    account_id uuid NOT NULL,
    role text NOT NULL
);
CREATE TABLE auth.accounts (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    active boolean DEFAULT false NOT NULL,
    email public.citext,
    new_email public.citext,
    password_hash text,
    default_role text DEFAULT 'user'::text NOT NULL,
    is_anonymous boolean DEFAULT false NOT NULL,
    custom_register_data jsonb,
    otp_secret text,
    mfa_enabled boolean DEFAULT false NOT NULL,
    ticket uuid DEFAULT public.gen_random_uuid() NOT NULL,
    ticket_expires_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT proper_email CHECK ((email OPERATOR(public.~*) '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'::public.citext)),
    CONSTRAINT proper_new_email CHECK ((new_email OPERATOR(public.~*) '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'::public.citext))
);
CREATE TABLE auth.providers (
    provider text NOT NULL
);
CREATE TABLE auth.refresh_tokens (
    refresh_token uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    account_id uuid NOT NULL
);
CREATE TABLE auth.roles (
    role text NOT NULL
);

ALTER TABLE ONLY auth.account_providers
    ADD CONSTRAINT account_providers_account_id_auth_provider_key UNIQUE (account_id, auth_provider);
ALTER TABLE ONLY auth.account_providers
    ADD CONSTRAINT account_providers_auth_provider_auth_provider_unique_id_key UNIQUE (auth_provider, auth_provider_unique_id);
ALTER TABLE ONLY auth.account_providers
    ADD CONSTRAINT account_providers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY auth.account_roles
    ADD CONSTRAINT account_roles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY auth.accounts
    ADD CONSTRAINT accounts_email_key UNIQUE (email);
ALTER TABLE ONLY auth.accounts
    ADD CONSTRAINT accounts_new_email_key UNIQUE (new_email);
ALTER TABLE ONLY auth.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY auth.accounts
    ADD CONSTRAINT accounts_user_id_key UNIQUE (user_id);
ALTER TABLE ONLY auth.providers
    ADD CONSTRAINT providers_pkey PRIMARY KEY (provider);
ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (refresh_token);
ALTER TABLE ONLY auth.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role);
ALTER TABLE ONLY auth.account_roles
    ADD CONSTRAINT user_roles_account_id_role_key UNIQUE (account_id, role);
CREATE TRIGGER set_auth_account_providers_updated_at BEFORE UPDATE ON auth.account_providers FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER set_auth_accounts_updated_at BEFORE UPDATE ON auth.accounts FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
ALTER TABLE ONLY auth.account_providers
    ADD CONSTRAINT account_providers_account_id_fkey FOREIGN KEY (account_id) REFERENCES auth.accounts(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY auth.account_providers
    ADD CONSTRAINT account_providers_auth_provider_fkey FOREIGN KEY (auth_provider) REFERENCES auth.providers(provider) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY auth.account_roles
    ADD CONSTRAINT account_roles_account_id_fkey FOREIGN KEY (account_id) REFERENCES auth.accounts(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY auth.account_roles
    ADD CONSTRAINT account_roles_role_fkey FOREIGN KEY (role) REFERENCES auth.roles(role) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE ONLY auth.accounts
    ADD CONSTRAINT accounts_default_role_fkey FOREIGN KEY (default_role) REFERENCES auth.roles(role) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE ONLY auth.accounts
    ADD CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_account_id_fkey FOREIGN KEY (account_id) REFERENCES auth.accounts(id) ON UPDATE CASCADE ON DELETE CASCADE;

INSERT INTO auth.providers (provider)
    VALUES ('github'), ('facebook'), ('twitter'), ('google'), ('apple'),  ('linkedin'), ('windowslive');
INSERT INTO auth.roles (role) 
  SELECT role FROM public.roles;
INSERT INTO auth.accounts (
    id, 
    created_at, 
    updated_at, 
    user_id, 
    active,
    email,
    password_hash,
    default_role,
    is_anonymous,
    custom_register_data
  ) 
  SELECT 
    user_accounts.id,
    user_accounts.created_at,
    user_accounts.updated_at,
    users.id,
    users.active,
    user_accounts.email,
    user_accounts.password,
    users.default_role,
    users.is_anonymous,
    users.register_data
  FROM 
    auth.user_accounts AS user_accounts
  JOIN users on users.id = user_accounts.user_id
;
INSERT INTO auth.account_providers (
  id,
  created_at,
  updated_at,
  account_id,
  auth_provider,
  auth_provider_unique_id
)
  SELECT 
    user_providers.id,
    user_providers.created_at,
    user_providers.updated_at,
    user_accounts.id,
    user_providers.auth_provider,
    user_providers.auth_provider_unique_id
  FROM
    auth.user_providers AS user_providers
  JOIN auth.user_accounts AS user_accounts ON user_accounts.user_id = user_providers.user_id
;
INSERT INTO auth.account_roles (id, created_at, account_id, role) 
  SELECT 
    user_roles.id,
    user_roles.created_at,
    user_accounts.id,
    user_roles.role
   FROM public.user_roles AS user_roles
   JOIN public.users AS users ON users.id = user_roles.user_id
   JOIN auth.user_accounts AS user_accounts ON user_accounts.user_id = users.id;
ALTER TABLE users
  DROP COLUMN active, 
  DROP COLUMN default_role, 
  DROP COLUMN email, 
  DROP COLUMN secret_token, 
  DROP COLUMN secret_token_expires_at, 
  DROP COLUMN register_data, 
  DROP COLUMN is_anonymous;
DROP TABLE public.roles, public.user_roles, auth.auth_providers, auth.user_accounts, auth.user_providers;