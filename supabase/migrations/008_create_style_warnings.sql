CREATE TABLE IF NOT EXISTS style_warnings (
  id TEXT PRIMARY KEY DEFAULT ('sw_' || encode(gen_random_bytes(12), 'hex')),
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  citation_id TEXT REFERENCES citations(id) ON DELETE SET NULL,
  reference_id TEXT REFERENCES "references"(id) ON DELETE SET NULL,
  code VARCHAR(50) NOT NULL,
  category VARCHAR(30) NOT NULL CHECK (category IN ('punctuation', 'formatting', 'ordering', 'completeness', 'capitalisation')),
  message TEXT NOT NULL,
  suggestion TEXT,
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('error', 'warning', 'info')),
  location JSONB NOT NULL,
  raw_text TEXT,
  rule_source VARCHAR(20) NOT NULL CHECK (rule_source IN ('rule_based', 'ai_powered')),
  style_guide_ref VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_style_warnings_document ON style_warnings (document_id);
CREATE INDEX IF NOT EXISTS idx_style_warnings_code ON style_warnings (document_id, code);
CREATE INDEX IF NOT EXISTS idx_style_warnings_severity ON style_warnings (document_id, severity);
