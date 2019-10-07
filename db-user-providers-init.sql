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

CREATE TABLE providers (
  provider text NOT NULL PRIMARY KEY
);


CREATE TABLE refresh_tokens (
  refresh_token uuid NOT NULL PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  user_id uuid NOT NULL
);

CREATE TABLE user_accounts (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  username text NOT NULL,
  email text,
  password text NOT NULL,
  register_data jsonb
);

CREATE TABLE user_providers (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  provider text NOT NULL,
  token text NOT NULL,
  raw_json jsonb,
  provider_user_id text NOT NULL
);

CREATE TABLE users (
  id uuid DEFAULT public.gen_random_uuid() NOT NULL PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  display_name text NOT NULL,
  active boolean DEFAULT false NOT NULL,
  default_role text DEFAULT 'user'::text NOT NULL,
  avatar_url text,
  email text,
  secret_token uuid DEFAULT gen_random_uuid() NOT NULL,
  secret_token_expires_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE roles (
  role text NOT NULL PRIMARY KEY
);

CREATE TABLE user_roles (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL
);


-- alter tables (constraints, FKs etc)

ALTER TABLE ONLY user_roles
  ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


CREATE TRIGGER set_public_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE set_current_timestamp_updated_at();
-- COMMENT ON TRIGGER set_public_users_updated_at ON users IS 'trigger to set value of column "updated_at" to current timestamp on row update';

CREATE TRIGGER set_public_user_accounts_updated_at BEFORE UPDATE ON user_accounts FOR EACH ROW EXECUTE PROCEDURE set_current_timestamp_updated_at();

CREATE TRIGGER set_public_user_providers_updated_at BEFORE UPDATE ON user_providers FOR EACH ROW EXECUTE PROCEDURE set_current_timestamp_updated_at();

ALTER TABLE ONLY refresh_tokens
  ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE CASCADE;

ALTER TABLE ONLY user_providers
  ADD CONSTRAINT user_providers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE CASCADE;

ALTER TABLE ONLY user_accounts
  ADD CONSTRAINT user_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE CASCADE;

ALTER TABLE ONLY user_roles
  ADD CONSTRAINT user_roles_role_fkey FOREIGN KEY (role) REFERENCES roles(role) ON UPDATE RESTRICT ON DELETE CASCADE;

ALTER TABLE ONLY user_roles
  ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE CASCADE;


ALTER TABLE ONLY users
  ADD CONSTRAINT users_default_role_fkey FOREIGN KEY (default_role) REFERENCES roles(role) ON UPDATE RESTRICT ON DELETE RESTRICT;

-- do inserts
INSERT INTO roles (role) VALUES ('user');

INSERT INTO providers (provider) VALUES ('github'), ('facebook'), ('twitter'), ('google');
