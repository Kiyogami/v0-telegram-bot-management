-- Add fields for storing temporary auth session data
ALTER TABLE bots ADD COLUMN IF NOT EXISTS phone_code_hash TEXT;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS session_string TEXT;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS is_authorized BOOLEAN DEFAULT FALSE;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS auth_error TEXT;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS last_auth_attempt TIMESTAMPTZ;
