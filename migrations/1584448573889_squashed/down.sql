alter table "public"."users"
  drop column "is_anonymous";

alter table "public"."users"
  drop constraint "users_default_role_fkey";

drop table "public"."user_roles";

drop table "public"."roles";

alter table "public"."users"
  drop column "default_role";
