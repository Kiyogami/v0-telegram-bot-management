-- Create bots table to store bot configurations
CREATE TABLE IF NOT EXISTS bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  api_id TEXT NOT NULL,
  api_hash TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'stopped' CHECK (status IN ('running', 'stopped', 'error')),
  message_content TEXT,
  min_delay INTEGER NOT NULL DEFAULT 20,
  max_delay INTEGER NOT NULL DEFAULT 40,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create groups table to track message statistics per bot
CREATE TABLE IF NOT EXISTS bot_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  group_id BIGINT NOT NULL,
  group_name TEXT NOT NULL,
  messages_sent INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create bot_logs table for tracking bot activity
CREATE TABLE IF NOT EXISTS bot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  log_type TEXT NOT NULL CHECK (log_type IN ('info', 'error', 'warning')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bots table
CREATE POLICY "Users can view their own bots"
  ON bots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bots"
  ON bots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bots"
  ON bots FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bots"
  ON bots FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for bot_groups table
CREATE POLICY "Users can view their bot groups"
  ON bot_groups FOR SELECT
  USING (bot_id IN (SELECT id FROM bots WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their bot groups"
  ON bot_groups FOR INSERT
  WITH CHECK (bot_id IN (SELECT id FROM bots WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their bot groups"
  ON bot_groups FOR UPDATE
  USING (bot_id IN (SELECT id FROM bots WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their bot groups"
  ON bot_groups FOR DELETE
  USING (bot_id IN (SELECT id FROM bots WHERE user_id = auth.uid()));

-- RLS Policies for bot_logs table
CREATE POLICY "Users can view their bot logs"
  ON bot_logs FOR SELECT
  USING (bot_id IN (SELECT id FROM bots WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their bot logs"
  ON bot_logs FOR INSERT
  WITH CHECK (bot_id IN (SELECT id FROM bots WHERE user_id = auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_bots_user_id ON bots(user_id);
CREATE INDEX idx_bot_groups_bot_id ON bot_groups(bot_id);
CREATE INDEX idx_bot_logs_bot_id ON bot_logs(bot_id);
CREATE INDEX idx_bot_logs_created_at ON bot_logs(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update updated_at
CREATE TRIGGER update_bots_updated_at
  BEFORE UPDATE ON bots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
