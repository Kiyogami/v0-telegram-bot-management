-- Add authorization fields to bots table
ALTER TABLE bots
ADD COLUMN IF NOT EXISTS is_authorized BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS session_string TEXT,
ADD COLUMN IF NOT EXISTS last_auth_attempt TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auth_error TEXT;

-- Add table for storing verification codes temporarily
CREATE TABLE IF NOT EXISTS bot_auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
  phone_code_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '10 minutes'
);

-- Add RLS policies for bot_auth_sessions
ALTER TABLE bot_auth_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their bot auth sessions"
  ON bot_auth_sessions
  FOR ALL
  USING (
    bot_id IN (
      SELECT id FROM bots WHERE user_id = (SELECT auth.uid())
    )
  );
