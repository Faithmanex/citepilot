-- 014_fix_rls_and_hardening.sql
-- Fixes RLS coverage gaps, hardens SECURITY DEFINER function, and adds missing indexes/constraints.
-- Addresses review findings: RLS on 10 tables, users UPDATE privilege escalation, search_path hijack.

-- 1. Harden handle_new_user: pin search_path to prevent hijack
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id,
    auth_user_id,
    email,
    email_verified,
    name,
    role,
    tier,
    avatar_url,
    created_at,
    updated_at
  ) VALUES (
    'usr_' || encode(gen_random_bytes(12), 'hex'),
    NEW.id,
    NEW.email,
    COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'user',
    'free',
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (auth_user_id) DO UPDATE
  SET
    email = EXCLUDED.email,
    email_verified = EXCLUDED.email_verified,
    name = CASE WHEN users.name IS NULL OR users.name = '' THEN EXCLUDED.name ELSE users.name END,
    avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-create trigger to ensure new function is bound
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also harden trigger_set_updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.trigger_update_citation_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.matched_reference_id IS NOT NULL THEN
      UPDATE "references" SET citation_count = (
        SELECT COUNT(*) FROM citations WHERE matched_reference_id = NEW.matched_reference_id
      ) WHERE id = NEW.matched_reference_id;
    END IF;
  END IF;
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    IF OLD.matched_reference_id IS NOT NULL THEN
      UPDATE "references" SET citation_count = (
        SELECT COUNT(*) FROM citations WHERE matched_reference_id = OLD.matched_reference_id
      ) WHERE id = OLD.matched_reference_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. Fix users UPDATE policy: prevent privilege escalation via role/tier
-- Drop the overly permissive policy from 013
DROP POLICY IF EXISTS "Users can update own profile" ON users;
-- New policy: can only update own row, and cannot escalate role/tier unless already privileged.
-- We enforce WITH CHECK that role and tier remain unchanged unless caller is already super_admin/institutional_admin.
-- Since RLS cannot easily enforce column-level checks, we use a WITH CHECK that ensures
-- role/tier are not being escalated. The simplest safe version: require WITH CHECK and
-- block role/tier changes entirely via policy + trigger (the trigger approach is more flexible,
-- but we at least require WITH CHECK here and rely on app-level checks; the policy is now safe
-- against blind UPDATE).
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Prevent direct role/tier escalation via a check trigger (defense-in-depth)
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
RETURNS TRIGGER AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Allow service_role to bypass (it bypasses RLS anyway)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  -- If role or tier is being changed, verify caller is already privileged
  IF NEW.role IS DISTINCT FROM OLD.role OR NEW.tier IS DISTINCT FROM OLD.tier THEN
    SELECT role INTO caller_role FROM public.users WHERE auth_user_id = auth.uid();
    -- Only super_admin can change role; only institutional_admin/super_admin can change tier to institutional
    IF NEW.role IS DISTINCT FROM OLD.role AND caller_role != 'super_admin' THEN
      RAISE EXCEPTION 'Insufficient privilege to change role';
    END IF;
    IF NEW.tier IS DISTINCT FROM OLD.tier AND caller_role NOT IN ('super_admin', 'institutional_admin') THEN
      -- Allow self-upgrade only from free -> professional via PayPal? Block direct tier writes entirely for now.
      -- The webhook and subscription flow use service_role (bypasses RLS), so normal users should not write tier at all.
      RAISE EXCEPTION 'Insufficient privilege to change tier';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS prevent_privilege_escalation ON users;
CREATE TRIGGER prevent_privilege_escalation
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_privilege_escalation();

-- 3. Enable RLS on all user-data tables (documents, citations, references, etc.)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE "references" ENABLE ROW LEVEL SECURITY;
ALTER TABLE citation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Helper: no helper function needed, use subqueries directly.

-- Documents: user can only access their own documents
DROP POLICY IF EXISTS "Users can manage own documents" ON documents;
CREATE POLICY "Users can manage own documents" ON documents
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Citations: via document ownership
DROP POLICY IF EXISTS "Users can manage own citations" ON citations;
CREATE POLICY "Users can manage own citations" ON citations
  FOR ALL USING (document_id IN (SELECT id FROM documents WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())))
  WITH CHECK (document_id IN (SELECT id FROM documents WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())));

-- References: via document ownership
DROP POLICY IF EXISTS "Users can manage own references" ON "references";
CREATE POLICY "Users can manage own references" ON "references"
  FOR ALL USING (document_id IN (SELECT id FROM documents WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())))
  WITH CHECK (document_id IN (SELECT id FROM documents WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())));

-- citation_results
DROP POLICY IF EXISTS "Users can manage own citation_results" ON citation_results;
CREATE POLICY "Users can manage own citation_results" ON citation_results
  FOR ALL USING (document_id IN (SELECT id FROM documents WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())))
  WITH CHECK (document_id IN (SELECT id FROM documents WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())));

-- reference_results
DROP POLICY IF EXISTS "Users can manage own reference_results" ON reference_results;
CREATE POLICY "Users can manage own reference_results" ON reference_results
  FOR ALL USING (document_id IN (SELECT id FROM documents WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())))
  WITH CHECK (document_id IN (SELECT id FROM documents WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())));

-- style_warnings
DROP POLICY IF EXISTS "Users can manage own style_warnings" ON style_warnings;
CREATE POLICY "Users can manage own style_warnings" ON style_warnings
  FOR ALL USING (document_id IN (SELECT id FROM documents WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())))
  WITH CHECK (document_id IN (SELECT id FROM documents WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())));

-- external_validations
DROP POLICY IF EXISTS "Users can manage own external_validations" ON external_validations;
CREATE POLICY "Users can manage own external_validations" ON external_validations
  FOR ALL USING (document_id IN (SELECT id FROM documents WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())))
  WITH CHECK (document_id IN (SELECT id FROM documents WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())));

-- organisation_members
DROP POLICY IF EXISTS "Users can view own organisation_members" ON organisation_members;
CREATE POLICY "Users can view own organisation_members" ON organisation_members
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    OR organisation_id IN (SELECT organisation_id FROM users WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage own organisation_membership" ON organisation_members;
CREATE POLICY "Users can manage own organisation_membership" ON organisation_members
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- usage_logs
DROP POLICY IF EXISTS "Users can manage own usage_logs" ON usage_logs;
CREATE POLICY "Users can manage own usage_logs" ON usage_logs
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- sessions: users can only see their own sessions
DROP POLICY IF EXISTS "Users can manage own sessions" ON sessions;
CREATE POLICY "Users can manage own sessions" ON sessions
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- 4. Missing indexes and hardening
-- users.organisation_id index
CREATE INDEX IF NOT EXISTS idx_users_organisation_id ON users (organisation_id) WHERE organisation_id IS NOT NULL;

-- documents: add updated_at for status/progress mutation tracking
ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at_documents ON documents;
CREATE TRIGGER set_updated_at_documents BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Improve document index for expires cleanup
-- idx_documents_expires already exists

-- Add FK constraint for citations.matched_reference_id (if not already)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_citations_matched_reference' AND table_name = 'citations'
  ) THEN
    ALTER TABLE citations ADD CONSTRAINT fk_citations_matched_reference
      FOREIGN KEY (matched_reference_id) REFERENCES "references"(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add check for char range (defense in depth)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'chk_citations_char_range'
  ) THEN
    ALTER TABLE citations ADD CONSTRAINT chk_citations_char_range CHECK (char_end >= char_start);
  END IF;
END $$;

-- Add check for match_score bounds
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'chk_citation_results_match_score'
  ) THEN
    ALTER TABLE citation_results ADD CONSTRAINT chk_citation_results_match_score CHECK (match_score >= 0 AND match_score <= 1);
  END IF;
END $$;
