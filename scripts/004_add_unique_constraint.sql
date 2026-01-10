-- Add unique constraint to prevent duplicate groups
ALTER TABLE bot_groups ADD CONSTRAINT unique_bot_group UNIQUE (bot_id, group_id);
