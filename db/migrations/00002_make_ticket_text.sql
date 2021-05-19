ALTER TABLE auth.accounts
  ALTER COLUMN ticket TYPE text,
  ALTER COLUMN ticket SET NOT NULL;
