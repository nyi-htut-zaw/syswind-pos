-- ====================================================================
-- Syswind V3: Allow SYSADMIN and Dynamic Custom Roles
-- ====================================================================

-- Drop any legacy check constraint on users.role that restricts role names
ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS users_role_check;

-- Ensure role column is sufficiently large for custom role names
ALTER TABLE IF EXISTS users ALTER COLUMN role TYPE VARCHAR(100);

-- Make sure images.data is BYTEA if not already
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'images' AND column_name = 'data' AND data_type != 'bytea'
    ) THEN
        ALTER TABLE images ALTER COLUMN data TYPE BYTEA USING data::bytea;
    END IF;
END $$;
