ALTER TABLE auth.accounts
  ADD COLUMN confirmation_reset_timeout timestamp with time zone DEFAULT now() NOT NULL;
  