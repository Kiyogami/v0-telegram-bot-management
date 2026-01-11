-- Complete fix for admin system without RLS recursion
-- This script replaces both 009 and 010

-- Step 1: Drop all problematic policies and functions first
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all ad templates" ON ad_templates;
DROP POLICY IF EXISTS "Admins can view all ad campaigns" ON ad_campaigns;
DROP POLICY IF EXISTS "Admins can view all ad stats" ON ad_stats;
DROP POLICY IF EXISTS "Admins can view all bots" ON bots;
DROP POLICY IF EXISTS "Admins can delete any bot" ON bots;
DROP FUNCTION IF EXISTS is_admin(UUID);

-- Step 2: Create admin_users table WITHOUT RLS (breaks recursion)
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Step 3: Set karoltofjut0@gmail.com as admin
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'karoltofjut0@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Step 4: Create is_admin function that uses admin_users (no RLS)
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admin_users WHERE user_id = check_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 5: Create user_profiles table if not exists
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 6: Create ad tables
CREATE TABLE IF NOT EXISTS ad_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_text TEXT NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('good', 'medium', 'bad')),
  style_dna JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_text TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('aggressor', 'smart_seller', 'normal', 'fomo', 'stealth')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  views INTEGER NOT NULL DEFAULT 0,
  replies INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ad_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  group_id BIGINT NOT NULL,
  group_name TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  replies INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 7: Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_stats ENABLE ROW LEVEL SECURITY;

-- Step 8: Create SIMPLE policies without recursion
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admin policies using is_admin() that doesn't cause recursion
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  USING (is_admin(auth.uid()));

-- Ad templates policies
DROP POLICY IF EXISTS "Users can manage their ad templates" ON ad_templates;
CREATE POLICY "Users can manage their ad templates"
  ON ad_templates FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all ad templates"
  ON ad_templates FOR SELECT
  USING (is_admin(auth.uid()));

-- Ad campaigns policies
DROP POLICY IF EXISTS "Users can manage their ad campaigns" ON ad_campaigns;
CREATE POLICY "Users can manage their ad campaigns"
  ON ad_campaigns FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all ad campaigns"
  ON ad_campaigns FOR SELECT
  USING (is_admin(auth.uid()));

-- Ad stats policies
DROP POLICY IF EXISTS "Users can view their ad stats" ON ad_stats;
CREATE POLICY "Users can view their ad stats"
  ON ad_stats FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM ad_campaigns WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all ad stats"
  ON ad_stats FOR SELECT
  USING (is_admin(auth.uid()));

-- Bots admin policies
CREATE POLICY "Admins can view all bots"
  ON bots FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete any bot"
  ON bots FOR DELETE
  USING (is_admin(auth.uid()));

-- Step 9: Create indexes
CREATE INDEX IF NOT EXISTS idx_ad_templates_bot_id ON ad_templates(bot_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_bot_id ON ad_campaigns(bot_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_stats_campaign_id ON ad_stats(campaign_id);

-- Step 10: Trigger for auto-creating user profile
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();
