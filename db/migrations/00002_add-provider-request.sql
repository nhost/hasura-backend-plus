CREATE TABLE IF NOT EXISTS auth.provider_requests (
  id uuid NOT NULL,
  redirect_url_success text NOT NULL,
  redirect_url_failure text NOT NULL
);

SELECT create_constraint_if_not_exists('auth.provider_requests', 'provider_requests_pkey', 'PRIMARY KEY (id);');
