CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT ('usr_' || encode(gen_random_bytes(12), 'hex')),
  email VARCHAR(320) NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  password_hash TEXT,
  name VARCHAR(200) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'institutional_admin', 'super_admin')),
  tier VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'student', 'professional', 'institutional')),
  avatar_url TEXT,
  oauth_provider VARCHAR(20) CHECK (oauth_provider IN ('google', 'microsoft')),
  oauth_provider_id VARCHAR(255),
  organisation_id TEXT,
  preferences JSONB NOT NULL DEFAULT '{}',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth ON users (oauth_provider, oauth_provider_id) WHERE oauth_provider IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_tier ON users (tier);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at);
