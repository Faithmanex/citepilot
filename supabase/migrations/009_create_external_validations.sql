CREATE TABLE IF NOT EXISTS external_validations (
  id TEXT PRIMARY KEY DEFAULT ('ev_' || encode(gen_random_bytes(12), 'hex')),
  reference_id TEXT NOT NULL REFERENCES "references"(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  source VARCHAR(20) NOT NULL CHECK (source IN ('crossref', 'openalex', 'pubmed', 'doi_org')),
  query_type VARCHAR(20) NOT NULL,
  query_value TEXT NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('verified', 'discrepancy', 'not_found', 'error', 'unavailable')),
  verified BOOLEAN NOT NULL,
  external_metadata JSONB,
  discrepancies JSONB NOT NULL DEFAULT '[]',
  response_time_ms INTEGER NOT NULL,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_external_validations_reference ON external_validations (reference_id);
CREATE INDEX IF NOT EXISTS idx_external_validations_document ON external_validations (document_id);
