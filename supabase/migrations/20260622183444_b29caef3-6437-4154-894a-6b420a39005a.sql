-- Create a read-only role for external AI agents (Codex, etc.)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'codex_readonly') THEN
    CREATE ROLE codex_readonly NOLOGIN;
  END IF;
END
$$;

-- Allow connecting to the database (login is gated by NOLOGIN above until password is set)
GRANT USAGE ON SCHEMA public TO codex_readonly;

-- Read existing tables in public
GRANT SELECT ON ALL TABLES IN SCHEMA public TO codex_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO codex_readonly;

-- Read future tables in public automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO codex_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON SEQUENCES TO codex_readonly;