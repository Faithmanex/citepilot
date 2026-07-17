CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY DEFAULT ('doc_' || encode(gen_random_bytes(12), 'hex')),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(500),
  label VARCHAR(200),
  mime_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  file_path TEXT,
  citation_style VARCHAR(30) NOT NULL CHECK (citation_style IN ('apa7', 'apa6', 'harvard', 'vancouver', 'chicago-author-date', 'chicago-notes', 'mla9', 'ieee', 'oscola', 'turabian')),
  multi_ref_list BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'parsing', 'parsed', 'analysing', 'analysed', 'validating', 'validated', 'failed')),
  progress SMALLINT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  word_count INTEGER,
  body_text TEXT,
  result_version INTEGER NOT NULL DEFAULT 1,
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '36 hours'),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_documents_user_created ON documents (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents (status) WHERE status NOT IN ('validated', 'failed');
CREATE INDEX IF NOT EXISTS idx_documents_expires ON documents (expires_at) WHERE deleted_at IS NULL;
