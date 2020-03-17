create schema private;

create extension if not exists citext;

create table private.refresh_tokens (
  created_at timestamp with time zone default now() not null,
  expires_at timestamp with time zone not null,
  refresh_token uuid not null,
  user_id uuid not null
);

create table private.user_accounts (
  email public.citext not null,
  password_hash text not null,
  user_id uuid not null,
  username public.citext not null,
  otp_secret text,
  mfa_enabled boolean default false not null
);

create table public.users (
  active boolean default false not null,
  created_at timestamp with time zone default now() not null,
  email public.citext not null,
  id uuid default public.gen_random_uuid () not null,
  ticket uuid default public.gen_random_uuid () not null,
  ticket_expires_at timestamp with time zone default now() not null,
  username public.citext not null
);

alter table only private.refresh_tokens
  add constraint refresh_tokens_pkey primary key (refresh_token);

alter table only private.refresh_tokens
  add constraint refresh_tokens_refresh_token_key unique (refresh_token);

alter table only private.user_accounts
  add constraint user_accounts_email_key unique (email);

alter table only private.user_accounts
  add constraint user_accounts_mfa_secret_key unique (otp_secret);

alter table only private.user_accounts
  add constraint user_accounts_pkey primary key (user_id);

alter table only private.user_accounts
  add constraint user_accounts_username_key unique (username);

alter table only public.users
  add constraint users_email_key unique (email);

alter table only public.users
  add constraint users_id_key unique (id);

alter table only public.users
  add constraint users_pkey primary key (id);

alter table only public.users
  add constraint users_secret_token_key unique (ticket);

alter table only public.users
  add constraint users_username_key unique (username);

alter table only private.refresh_tokens
  add constraint refresh_tokens_user_id_fkey foreign key (user_id) references public.users (id) on update cascade on delete restrict;

alter table only private.user_accounts
  add constraint user_accounts_email_fkey foreign key (email) references public.users (email) on update cascade on delete restrict;

alter table only private.user_accounts
  add constraint user_accounts_user_id_fkey foreign key (user_id) references public.users (id) on update restrict on delete restrict;

alter table only private.user_accounts
  add constraint user_accounts_username_fkey foreign key (username) references public.users (username) on update cascade on delete restrict;
