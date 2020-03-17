create extension if not exists pgcrypto;

create function set_current_timestamp_updated_at ()
  returns trigger
  language plpgsql
  as $$
declare
  _new record;
begin
  _new := new;
  _new. "updated_at" = now();
  return _new;
end;
$$;

create schema auth;

create table auth.auth_providers (
  provider text not null primary key
);

create table auth.refresh_tokens (
  refresh_token uuid not null primary key,
  created_at timestamp with time zone default now() not null,
  expires_at timestamp with time zone not null,
  user_id uuid not null
);

create table auth.user_accounts (
  id uuid default gen_random_uuid () not null primary key,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  user_id uuid not null,
  username text not null unique,
  email text unique,
  password text not null
);

create table auth.user_providers (
  id uuid default gen_random_uuid () not null primary key,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  user_id uuid not null,
  auth_provider text not null,
  auth_provider_unique_id text not null
);

create table public.users (
  id uuid default public.gen_random_uuid () not null primary key,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  display_name text not null,
  active boolean default false not null,
  default_role text default 'user' ::text not null,
  avatar_url text,
  email text unique,
  secret_token uuid default gen_random_uuid () not null unique,
  secret_token_expires_at timestamp with time zone default now() not null,
  register_data jsonb,
  is_anonymous boolean default false not null
);

create table public.roles (
  role text not null primary key
);

create table public.user_roles (
  id uuid default gen_random_uuid () not null primary key,
  created_at timestamp with time zone default now() not null,
  user_id uuid not null,
  role text not null
);

alter table only public.user_roles
  add constraint user_roles_user_id_role_key unique (user_id, role);

alter table only auth.user_providers
  add constraint user_providers_auth_provider_auth_provider_unique_id_key unique (auth_provider, auth_provider_unique_id),
  add constraint user_providers_user_id_auth_provider_key unique (user_id, auth_provider);

create trigger set_public_users_updated_at
  before update on public.users
  for each row
  execute procedure set_current_timestamp_updated_at ();

create trigger set_public_user_accounts_updated_at
  before update on auth.user_accounts
  for each row
  execute procedure set_current_timestamp_updated_at ();

create trigger set_public_user_providers_updated_at
  before update on auth.user_providers
  for each row
  execute procedure set_current_timestamp_updated_at ();

alter table only auth.refresh_tokens
  add constraint refresh_tokens_user_id_fkey foreign key (user_id) references public.users (id) on update restrict on delete cascade;

alter table only auth.user_providers
  add constraint user_providers_user_id_fkey foreign key (user_id) references public.users (id) on update restrict on delete cascade;

alter table only auth.user_providers
  add constraint user_providers_auth_providers_fk foreign key (auth_provider) references auth.auth_providers (provider) on update restrict on delete restrict;

alter table only auth.user_accounts
  add constraint user_accounts_user_id_fkey foreign key (user_id) references public.users (id) on update restrict on delete cascade;

alter table only public.user_roles
  add constraint user_roles_role_fkey foreign key (role) references public.roles (role) on update restrict on delete cascade;

alter table only public.user_roles
  add constraint user_roles_user_id_fkey foreign key (user_id) references public.users (id) on update restrict on delete cascade;

alter table only public.users
  add constraint users_default_role_fkey foreign key (default_role) references public.roles (role) on update restrict on delete restrict;

insert into public.roles (role)
  values ('user');

insert into public.roles (role)
  values ('anonymous');

insert into auth.auth_providers (provider)
  values ('github'), ('facebook'), ('twitter'), ('google');