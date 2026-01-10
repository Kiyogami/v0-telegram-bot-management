-- Add enabled field to bot_groups to track which groups are active
ALTER TABLE bot_groups
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE;

-- Add unique constraint to prevent duplicate group entries (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_bot_group'
    ) THEN
        ALTER TABLE bot_groups
        ADD CONSTRAINT unique_bot_group UNIQUE (bot_id, group_id);
    END IF;
END $$;
