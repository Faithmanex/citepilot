CREATE TABLE IF NOT EXISTS citation_results (
  id TEXT PRIMARY KEY DEFAULT ('cr_' || encode(gen_random_bytes(12), 'hex')),
  citation_id TEXT NOT NULL UNIQUE REFERENCES citations(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  match_type VARCHAR(20) NOT NULL CHECK (match_type IN ('exact', 'fuzzy', 'ai_verified', 'none')),
  match_score REAL NOT NULL,
  author_score REAL,
  year_score REAL,
  title_similarity REAL,
  issues JSONB NOT NULL DEFAULT '[]',
  ai_explanation TEXT,
  ai_suggestion TEXT,
  model_used VARCHAR(50) NOT NULL,
  processing_time_ms INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citation_results_document ON citation_results (document_id);
CREATE INDEX IF NOT EXISTS idx_citation_results_match_type ON citation_results (document_id, match_type);

CREATE TABLE IF NOT EXISTS reference_results (
  id TEXT PRIMARY KEY DEFAULT ('rr_' || encode(gen_random_bytes(12), 'hex')),
  reference_id TEXT NOT NULL UNIQUE REFERENCES "references"(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  is_orphaned BOOLEAN NOT NULL DEFAULT FALSE,
  is_retracted BOOLEAN NOT NULL DEFAULT FALSE,
  is_hallucinated BOOLEAN NOT NULL DEFAULT FALSE,
  hallucination_confidence REAL,
  hallucination_evidence TEXT,
  retraction_detail JSONB,
  issues JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reference_results_document ON reference_results (document_id);
