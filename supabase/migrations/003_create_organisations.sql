CREATE TABLE IF NOT EXISTS organisations (
  id TEXT PRIMARY KEY DEFAULT ('org_' || encode(gen_random_bytes(12), 'hex')),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  domain VARCHAR(255),
  max_seats INTEGER NOT NULL DEFAULT 100,
  sso_provider VARCHAR(20),
  sso_config JSONB,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_organisations_domain ON organisations (domain) WHERE domain IS NOT NULL;

ALTER TABLE users ADD CONSTRAINT fk_users_organisation FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS organisation_members (
  id TEXT PRIMARY KEY DEFAULT ('om_' || encode(gen_random_bytes(12), 'hex')),
  organisation_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended')),
  invited_by TEXT REFERENCES users(id),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_org_members_unique ON organisation_members (organisation_id, user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organisation_members (user_id);
