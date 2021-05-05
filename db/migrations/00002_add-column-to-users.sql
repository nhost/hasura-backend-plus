CREATE TABLE public.testing (
  id uuid DEFAULT public.gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  name_testing text
)

