-- Add scheduling and enhanced logging
ALTER TABLE bots ADD COLUMN IF NOT EXISTS schedule_enabled BOOLEAN DEFAULT false;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS schedule_time TEXT DEFAULT '09:00';
ALTER TABLE bots ADD COLUMN IF NOT EXISTS schedule_days TEXT DEFAULT 'Mon,Tue,Wed,Thu,Fri';
ALTER TABLE bots ADD COLUMN IF NOT EXISTS message_limit INTEGER DEFAULT 0;

-- Create message_logs table for tracking sent messages
CREATE TABLE IF NOT EXISTS message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  group_id BIGINT NOT NULL,
  message_text TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_message_logs_bot_id ON message_logs(bot_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_sent_at ON message_logs(sent_at DESC);

-- RLS Policies
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their message logs"
  ON message_logs FOR SELECT
  USING (bot_id IN (SELECT id FROM bots WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Users can insert their message logs"
  ON message_logs FOR INSERT
  WITH CHECK (bot_id IN (SELECT id FROM bots WHERE user_id = auth.uid()));
