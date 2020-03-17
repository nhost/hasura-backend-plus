
ALTER TABLE "public"."users" ADD COLUMN "default_role" text NULL DEFAULT 'user';
CREATE TABLE "public"."roles"("name" text NOT NULL, PRIMARY KEY ("name") , UNIQUE ("name"));
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."user_roles"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "role" text NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("role") REFERENCES "public"."roles"("name") ON UPDATE restrict ON DELETE cascade, FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE restrict ON DELETE cascade, UNIQUE ("id"), UNIQUE ("role", "user_id"));
alter table "public"."users"
           add constraint "users_default_role_fkey"
           foreign key ("default_role")
           references "public"."roles"
           ("name") on update restrict on delete restrict;
INSERT INTO public.roles (name) VALUES ('user'), ('anonymous');
ALTER TABLE "public"."users" ADD COLUMN "is_anonymous" boolean NOT NULL DEFAULT FALSE;