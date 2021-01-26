CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE SCHEMA auth;
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  _new record;
begin
  _new := new;
  _new. "updated_at" = now();
  return _new;
end;
$$;
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
CREATE TABLE public.users (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    display_name text,
    avatar_url text
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
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
CREATE TRIGGER set_auth_account_providers_updated_at BEFORE UPDATE ON auth.account_providers FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER set_auth_accounts_updated_at BEFORE UPDATE ON auth.accounts FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER set_public_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
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

INSERT INTO auth.roles (role)
    VALUES ('user'), ('anonymous'), ('me');

INSERT INTO auth.providers (provider)
    VALUES ('github'), ('facebook'), ('twitter'), ('google'), ('apple'),  ('linkedin'), ('windowslive'), ('spotify');
