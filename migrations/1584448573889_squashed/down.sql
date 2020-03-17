
ALTER TABLE "public"."users" DROP COLUMN "is_anonymous";
alter table "public"."users" drop constraint "users_default_role_fkey";
DROP TABLE "public"."user_roles";
DROP TABLE "public"."roles";
ALTER TABLE "public"."users" DROP COLUMN "default_role";