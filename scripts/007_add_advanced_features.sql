-- Add schedule fields to bots table
ALTER TABLE bots ADD COLUMN IF NOT EXISTS schedule_enabled BOOLEAN DEFAULT false;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS schedule_start_hour INTEGER DEFAULT 8;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS schedule_end_hour INTEGER DEFAULT 22;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS schedule_days TEXT DEFAULT 'mon,tue,wed,thu,fri,sat,sun';
ALTER TABLE bots ADD COLUMN IF NOT EXISTS messages_list TEXT[] DEFAULT '{}';
ALTER TABLE bots ADD COLUMN IF NOT EXISTS daily_message_limit INTEGER DEFAULT 100;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS messages_sent_today INTEGER DEFAULT 0;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS last_message_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Enable RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);
