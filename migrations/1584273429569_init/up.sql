CREATE SCHEMA private;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE TABLE private.refresh_tokens (
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    refresh_token uuid NOT NULL,
    user_id uuid NOT NULL
);
CREATE TABLE private.user_accounts (
    email public.citext NOT NULL,
    password_hash text NOT NULL,
    user_id uuid NOT NULL,
    username public.citext NOT NULL,
    otp_secret text,
    mfa_enabled boolean DEFAULT false NOT NULL
);
CREATE TABLE public.users (
    active boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    email public.citext NOT NULL,
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    ticket uuid DEFAULT public.gen_random_uuid() NOT NULL,
    ticket_expires_at timestamp with time zone DEFAULT now() NOT NULL,
    username public.citext NOT NULL
);
ALTER TABLE ONLY private.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (refresh_token);
ALTER TABLE ONLY private.refresh_tokens
    ADD CONSTRAINT refresh_tokens_refresh_token_key UNIQUE (refresh_token);
ALTER TABLE ONLY private.user_accounts
    ADD CONSTRAINT user_accounts_email_key UNIQUE (email);
ALTER TABLE ONLY private.user_accounts
    ADD CONSTRAINT user_accounts_mfa_secret_key UNIQUE (otp_secret);
ALTER TABLE ONLY private.user_accounts
    ADD CONSTRAINT user_accounts_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY private.user_accounts
    ADD CONSTRAINT user_accounts_username_key UNIQUE (username);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_key UNIQUE (id);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_secret_token_key UNIQUE (ticket);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);
ALTER TABLE ONLY private.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE ONLY private.user_accounts
    ADD CONSTRAINT user_accounts_email_fkey FOREIGN KEY (email) REFERENCES public.users(email) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE ONLY private.user_accounts
    ADD CONSTRAINT user_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY private.user_accounts
    ADD CONSTRAINT user_accounts_username_fkey FOREIGN KEY (username) REFERENCES public.users(username) ON UPDATE CASCADE ON DELETE RESTRICT;
