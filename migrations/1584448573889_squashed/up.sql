alter table "public"."users"
  add column "default_role" text null default 'user';

create table "public"."roles" ( "name" text not null, primary key ("name"), unique ("name")
);

create extension if not exists pgcrypto;

create table "public"."user_roles" ( "id" uuid not null default gen_random_uuid (), "created_at" timestamptz not null default now(), "user_id" uuid not null, "role" text not null, primary key ("id"), foreign key ("role") references "public"."roles" ("name"
) on update restrict on delete cascade, foreign key ("user_id") references "public"."users" ("id"
) on update restrict on delete cascade, unique ("id"), unique ("role", "user_id")
);

alter table "public"."users"
  add constraint "users_default_role_fkey" foreign key ("default_role") references "public"."roles" ("name") on update restrict on delete restrict;

insert into public.roles (name)
  values ('user'), ('anonymous');

alter table "public"."users"
  add column "is_anonymous" boolean not null default false;
