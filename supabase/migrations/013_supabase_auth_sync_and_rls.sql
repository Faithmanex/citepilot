-- 013_supabase_auth_sync_and_rls.sql
-- Enables Supabase Auth trigger synchronization, RLS policies, and audit report persistence

-- 1. Ensure public.users table has auth_user_id mapping or links to auth.users
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;

-- Create function and trigger to automatically create public.users record when a new user signs up via Supabase Auth
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Audits Table for saving analysis history
CREATE TABLE IF NOT EXISTS audits (
  id TEXT PRIMARY KEY DEFAULT ('aud_' || encode(gen_random_bytes(12), 'hex')),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  document_name VARCHAR(255) NOT NULL DEFAULT 'Untitled Document',
  citation_style VARCHAR(50) NOT NULL DEFAULT 'apa7',
  audit_mode VARCHAR(50) NOT NULL DEFAULT 'full',
  word_count INT NOT NULL DEFAULT 0,
  citation_count INT NOT NULL DEFAULT 0,
  reference_count INT NOT NULL DEFAULT 0,
  score INT NOT NULL DEFAULT 100,
  results JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audits_user_created ON audits (user_id, created_at DESC);

-- 3. Enhance Subscriptions Table for PayPal integration
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS paypal_subscription_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS paypal_payer_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS paypal_plan_id VARCHAR(255);
ALTER TABLE subscriptions ALTER COLUMN stripe_customer_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_paypal_sub ON subscriptions (paypal_subscription_id) WHERE paypal_subscription_id IS NOT NULL;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- RLS Policies for subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- RLS Policies for audits
DROP POLICY IF EXISTS "Users can view own audits" ON audits;
CREATE POLICY "Users can view own audits" ON audits
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create own audits" ON audits;
CREATE POLICY "Users can create own audits" ON audits
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own audits" ON audits;
CREATE POLICY "Users can delete own audits" ON audits
  FOR DELETE USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );
