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

CREATE TABLE refetch_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    user_id uuid NOT NULL,
    refetch_token uuid NOT NULL UNIQUE
);

CREATE TABLE roles (
    name text NOT NULL PRIMARY KEY
);

INSERT INTO roles (name) VALUES ('user');

CREATE TABLE user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL
);


CREATE TABLE users (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    username text NOT NULL UNIQUE,
    password text NOT NULL,
    active boolean DEFAULT false NOT NULL,
    secret_token uuid NOT NULL,
    secret_token_expires_at timestamp with time zone DEFAULT now() NOT NULL,
    default_role text DEFAULT 'user'::text NOT NULL,
    register_data jsonb
);

ALTER TABLE ONLY user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


CREATE TRIGGER set_public_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE set_current_timestamp_updated_at();

COMMENT ON TRIGGER set_public_users_updated_at ON users IS 'trigger to set value of column "updated_at" to current timestamp on row update';


ALTER TABLE ONLY refetch_tokens
    ADD CONSTRAINT refetch_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE CASCADE;

ALTER TABLE ONLY user_roles
    ADD CONSTRAINT user_roles_role_fkey FOREIGN KEY (role) REFERENCES roles(name) ON UPDATE RESTRICT ON DELETE CASCADE;

ALTER TABLE ONLY user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE CASCADE;


ALTER TABLE ONLY users
    ADD CONSTRAINT users_default_role_fkey FOREIGN KEY (default_role) REFERENCES roles(name) ON UPDATE RESTRICT ON DELETE RESTRICT;
