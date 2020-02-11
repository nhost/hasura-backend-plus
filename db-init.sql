CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE FUNCTION set_current_timestamp_updated_at() RETURNS trigger
  LANGUAGE plpgsql
  AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$;

CREATE SCHEMA auth;

CREATE TABLE auth.auth_providers (
  provider text NOT NULL PRIMARY KEY
);


CREATE TABLE auth.refresh_tokens (
  refresh_token uuid NOT NULL PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  user_id uuid NOT NULL
);

CREATE TABLE auth.user_accounts (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  username text NOT NULL UNIQUE,
  email text UNIQUE,
  password text NOT NULL
);

CREATE TABLE auth.user_providers (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  token text NOT NULL,
  auth_provider text NOT NULL,
  auth_provider_unique_id text NOT NULL
);

CREATE TABLE public.users (
  id uuid DEFAULT public.gen_random_uuid() NOT NULL PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  display_name text NOT NULL,
  active boolean DEFAULT false NOT NULL,
  default_role text DEFAULT 'user'::text NOT NULL,
  avatar_url text,
  email text UNIQUE,
  secret_token uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  secret_token_expires_at timestamp with time zone DEFAULT now() NOT NULL,
  register_data jsonb,
  is_anonymous boolean DEFAULT false NOT NULL
);

CREATE TABLE public.roles (
  role text NOT NULL PRIMARY KEY
);

CREATE TABLE public.user_roles (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL
);


-- alter tables (constraints, FKs etc)
ALTER TABLE ONLY public.user_roles
  ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

ALTER TABLE ONLY auth.user_providers
  ADD CONSTRAINT user_providers_auth_provider_auth_provider_unique_id_key UNIQUE (auth_provider, auth_provider_unique_id),
  ADD CONSTRAINT user_providers_user_id_auth_provider_key UNIQUE (user_id, auth_provider);

CREATE TRIGGER set_public_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE set_current_timestamp_updated_at();

CREATE TRIGGER set_public_user_accounts_updated_at BEFORE UPDATE ON auth.user_accounts FOR EACH ROW EXECUTE PROCEDURE set_current_timestamp_updated_at();

CREATE TRIGGER set_public_user_providers_updated_at BEFORE UPDATE ON auth.user_providers FOR EACH ROW EXECUTE PROCEDURE set_current_timestamp_updated_at();

ALTER TABLE ONLY auth.refresh_tokens
  ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE CASCADE;

ALTER TABLE ONLY auth.user_providers
  ADD CONSTRAINT user_providers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE CASCADE;

ALTER TABLE ONLY auth.user_providers
  ADD CONSTRAINT user_providers_auth_providers_fk FOREIGN KEY (auth_provider) REFERENCES auth.auth_providers(provider) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY auth.user_accounts
  ADD CONSTRAINT user_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE CASCADE;

ALTER TABLE ONLY public.user_roles
  ADD CONSTRAINT user_roles_role_fkey FOREIGN KEY (role) REFERENCES public.roles(role) ON UPDATE RESTRICT ON DELETE CASCADE;

ALTER TABLE ONLY public.user_roles
  ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE CASCADE;


ALTER TABLE ONLY public.users
  ADD CONSTRAINT users_default_role_fkey FOREIGN KEY (default_role) REFERENCES public.roles(role) ON UPDATE RESTRICT ON DELETE RESTRICT;

-- do inserts
INSERT INTO public.roles (role) VALUES ('user');
INSERT INTO public.roles (role) VALUES ('anonymous');

INSERT INTO auth.auth_providers (provider) VALUES ('github'), ('facebook'), ('twitter'), ('google');
