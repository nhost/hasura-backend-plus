ALTER TABLE auth.accounts
  ADD COLUMN last_sent_confirmation timestamp with time zone DEFAULT now() NOT NULL;
  