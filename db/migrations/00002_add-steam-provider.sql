INSERT INTO auth.providers (provider)
    VALUES ('steam') ON CONFLICT DO NOTHING;
