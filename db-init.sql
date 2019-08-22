CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE refetch_tokens (
    id integer NOT NULL,
    refetch_token uuid NOT NULL,
    user_id integer NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


CREATE SEQUENCE refetch_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE refetch_tokens_id_seq OWNED BY refetch_tokens.id;


CREATE TABLE roles (
    name text NOT NULL
);

CREATE TABLE users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    active boolean DEFAULT false NOT NULL,
    secret_token uuid DEFAULT gen_random_uuid() NOT NULL,
    default_role text DEFAULT 'user'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    register_data jsonb
);

CREATE SEQUENCE users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE users_id_seq OWNED BY users.id;

CREATE TABLE users_x_roles (
    id integer NOT NULL,
    user_id integer NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE users_x_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE users_x_roles_id_seq OWNED BY users_x_roles.id;


ALTER TABLE ONLY refetch_tokens ALTER COLUMN id SET DEFAULT nextval('refetch_tokens_id_seq'::regclass);
ALTER TABLE ONLY users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);
ALTER TABLE ONLY users_x_roles ALTER COLUMN id SET DEFAULT nextval('users_x_roles_id_seq'::regclass);

ALTER TABLE ONLY refetch_tokens
    ADD CONSTRAINT refetch_tokens_pkey PRIMARY KEY (id);

ALTER TABLE ONLY refetch_tokens
    ADD CONSTRAINT refetch_tokens_refetch_token_key UNIQUE (refetch_token);

ALTER TABLE ONLY roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (name);

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY users
    ADD CONSTRAINT users_username_key UNIQUE (username);

ALTER TABLE ONLY users_x_roles
    ADD CONSTRAINT users_x_roles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY users_x_roles
    ADD CONSTRAINT users_x_roles_user_id_role_key UNIQUE (user_id, role);

ALTER TABLE ONLY refetch_tokens
    ADD CONSTRAINT refetch_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE CASCADE;

ALTER TABLE ONLY users
    ADD CONSTRAINT users_default_role_fkey FOREIGN KEY (default_role) REFERENCES roles(name) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY users_x_roles
    ADD CONSTRAINT users_x_roles_role_fkey FOREIGN KEY (role) REFERENCES roles(name) ON UPDATE RESTRICT ON DELETE CASCADE;

ALTER TABLE ONLY users_x_roles
    ADD CONSTRAINT users_x_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE CASCADE;

INSERT INTO roles (name) VALUES ('user')
