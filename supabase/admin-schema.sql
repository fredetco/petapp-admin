-- =============================================================
-- MyZoo Admin Dashboard — Database Schema
-- Run AFTER main app schema and portal schema
-- =============================================================

-- Enable UUID generation (should already exist from main app)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- 1. Admin Users
-- =============================================================
CREATE TABLE admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'content_admin', 'viewer')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Helper function to avoid RLS recursion (same pattern as portal)
CREATE OR REPLACE FUNCTION get_admin_user_ids()
RETURNS SETOF UUID AS $$
  SELECT user_id FROM public.admin_users WHERE active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_super_admin_user_ids()
RETURNS SETOF UUID AS $$
  SELECT user_id FROM public.admin_users WHERE role = 'super_admin' AND active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Only admins can see admin table
CREATE POLICY "Admins can view admin users" ON admin_users
  FOR SELECT USING (
    auth.uid() IN (SELECT get_admin_user_ids())
  );

-- Only super_admin can modify
CREATE POLICY "Super admins can manage" ON admin_users
  FOR ALL USING (
    auth.uid() IN (SELECT get_super_admin_user_ids())
  );

-- Auto-update updated_at
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- 2. AI Prompts (versioned, auditable)
-- =============================================================
CREATE TABLE ai_prompts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  prompt_key TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),

  -- Content
  title TEXT NOT NULL,
  description TEXT,
  prompt_text TEXT NOT NULL,

  -- Metadata
  created_by UUID REFERENCES admin_users(id),
  approved_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_ai_prompts_key ON ai_prompts(prompt_key, status);

ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage prompts" ON ai_prompts
  FOR ALL USING (
    auth.uid() IN (SELECT get_admin_user_ids())
  );

-- Trigger: only one active prompt per key
CREATE OR REPLACE FUNCTION enforce_single_active_prompt()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE ai_prompts
    SET status = 'archived', archived_at = NOW()
    WHERE prompt_key = NEW.prompt_key
      AND status = 'active'
      AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_single_active_prompt
  BEFORE INSERT OR UPDATE ON ai_prompts
  FOR EACH ROW EXECUTE FUNCTION enforce_single_active_prompt();

-- =============================================================
-- 3. AI Prompt Audit Log
-- =============================================================
CREATE TABLE ai_prompt_audit (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  prompt_id UUID REFERENCES ai_prompts(id),
  action TEXT NOT NULL,
  changed_by UUID REFERENCES admin_users(id),
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_prompt_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log" ON ai_prompt_audit
  FOR SELECT USING (
    auth.uid() IN (SELECT get_admin_user_ids())
  );

CREATE POLICY "Admins can insert audit entries" ON ai_prompt_audit
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT get_admin_user_ids())
  );

-- =============================================================
-- 4. Species Care Templates
-- =============================================================
CREATE TABLE species_care_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  species TEXT NOT NULL,
  breed TEXT,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),

  -- Template content
  display_name TEXT NOT NULL,
  description TEXT,
  template_tasks JSONB NOT NULL,

  -- Expert metadata
  created_by UUID REFERENCES admin_users(id),
  reviewed_by UUID REFERENCES admin_users(id),
  review_notes TEXT,
  expert_confidence TEXT DEFAULT 'draft' CHECK (expert_confidence IN ('draft', 'reviewed', 'verified')),

  -- Complexity variants
  minimal_task_ids TEXT[],
  standard_task_ids TEXT[],
  detailed_task_ids TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_species ON species_care_templates(species, breed, status);

ALTER TABLE species_care_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage templates" ON species_care_templates
  FOR ALL USING (
    auth.uid() IN (SELECT get_admin_user_ids())
  );

-- Auto-update updated_at
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON species_care_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- 5. Platform Settings
-- =============================================================
CREATE TABLE platform_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES admin_users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings" ON platform_settings
  FOR ALL USING (
    auth.uid() IN (SELECT get_admin_user_ids())
  );

-- Public can read (needed by user app)
CREATE POLICY "Anyone can read settings" ON platform_settings
  FOR SELECT USING (true);

-- Seed default values
INSERT INTO platform_settings (key, value, description) VALUES
  ('default_complexity', '"standard"', 'Default care plan complexity for new users'),
  ('max_tasks_minimal', '8', 'Maximum tasks in minimal complexity mode'),
  ('max_tasks_standard', '16', 'Maximum tasks in standard complexity mode'),
  ('max_tasks_detailed', '25', 'Maximum tasks in detailed complexity mode'),
  ('categories', '["daily_care", "health", "grooming", "habitat"]', 'Active task categories'),
  ('supported_languages', '["en", "fr"]', 'Supported languages for care plans');

-- =============================================================
-- 6. Add complexity column to profiles (main app table)
-- =============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS care_plan_complexity TEXT DEFAULT 'standard'
  CHECK (care_plan_complexity IN ('minimal', 'standard', 'detailed'));
