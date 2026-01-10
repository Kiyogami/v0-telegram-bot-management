-- Add auto_reply_message field to bots table
ALTER TABLE bots ADD COLUMN IF NOT EXISTS auto_reply_message TEXT DEFAULT 'To jest tylko bot. Pisz do @praskizbawiciel';
ALTER TABLE bots ADD COLUMN IF NOT EXISTS auto_reply_enabled BOOLEAN DEFAULT true;
