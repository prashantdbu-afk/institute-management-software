-- Release gate: validate application-owned constraints after historical-row audit.
-- Safe to repeat: already validated constraints are ignored.
-- Supabase-managed schemas are intentionally excluded; their owners manage them.
DO $$
DECLARE
  constraint_row record;
BEGIN
  FOR constraint_row IN
    SELECT n.nspname AS schema_name, c.relname AS table_name, con.conname AS constraint_name
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND NOT con.convalidated
    ORDER BY c.relname, con.conname
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I VALIDATE CONSTRAINT %I',
      constraint_row.schema_name,
      constraint_row.table_name,
      constraint_row.constraint_name
    );
  END LOOP;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND NOT con.convalidated
  ) THEN
    RAISE EXCEPTION 'One or more public constraints remain NOT VALID';
  END IF;
END
$$;
