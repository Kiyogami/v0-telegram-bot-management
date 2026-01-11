-- Naprawia wszystkie konflikty i przygotowuje finalna strukture

-- Drop kolumny z konfliktami jeśli istnieją
ALTER TABLE bots DROP COLUMN IF EXISTS schedule_time CASCADE;
ALTER TABLE bots DROP COLUMN IF EXISTS message_limit CASCADE;

-- Dodaj wszystkie potrzebne kolumny z IF NOT EXISTS
ALTER TABLE bots ADD COLUMN IF NOT EXISTS schedule_enabled BOOLEAN DEFAULT false;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS schedule_start_hour INTEGER DEFAULT 8;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS schedule_end_hour INTEGER DEFAULT 22;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS schedule_days TEXT DEFAULT 'mon,tue,wed,thu,fri,sat,sun';
ALTER TABLE bots ADD COLUMN IF NOT EXISTS messages_list TEXT[] DEFAULT '{}';
ALTER TABLE bots ADD COLUMN IF NOT EXISTS daily_message_limit INTEGER DEFAULT 100;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS messages_sent_today INTEGER DEFAULT 0;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS last_message_reset TIMESTAMPTZ DEFAULT NOW();

-- Dodaj enabled do bot_groups jesli nie istnieje
ALTER TABLE bot_groups ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;
ALTER TABLE bot_groups ADD COLUMN IF NOT EXISTS group_type TEXT;
ALTER TABLE bot_groups ADD COLUMN IF NOT EXISTS participant_count INTEGER DEFAULT 0;

-- Unique constraint dla grup
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_bot_group'
    ) THEN
        ALTER TABLE bot_groups ADD CONSTRAINT unique_bot_group UNIQUE (bot_id, group_id);
    END IF;
END $$;

-- Tabela message_logs
CREATE TABLE IF NOT EXISTS message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  group_id BIGINT NOT NULL,
  message_text TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_logs_bot_id ON message_logs(bot_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_sent_at ON message_logs(sent_at DESC);

ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their message logs" ON message_logs;
CREATE POLICY "Users can view their message logs"
  ON message_logs FOR SELECT
  USING (bot_id IN (SELECT id FROM bots WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert their message logs" ON message_logs;
CREATE POLICY "Users can insert their message logs"
  ON message_logs FOR INSERT
  WITH CHECK (bot_id IN (SELECT id FROM bots WHERE user_id = auth.uid()));

-- Tabela notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);
