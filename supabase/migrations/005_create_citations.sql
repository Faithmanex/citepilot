CREATE TABLE IF NOT EXISTS citations (
  id TEXT PRIMARY KEY DEFAULT ('cit_' || encode(gen_random_bytes(12), 'hex')),
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  normalised_text TEXT NOT NULL,
  extracted_authors TEXT[] NOT NULL DEFAULT '{}',
  extracted_year SMALLINT,
  citation_number SMALLINT,
  paragraph_index INTEGER NOT NULL,
  char_start INTEGER NOT NULL,
  char_end INTEGER NOT NULL,
  context TEXT NOT NULL,
  citation_type VARCHAR(20) NOT NULL CHECK (citation_type IN ('parenthetical', 'narrative', 'numeric', 'footnote')),
  matched_reference_id TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'possible_match', 'no_match', 'ignored')),
  confidence REAL,
  ignored BOOLEAN NOT NULL DEFAULT FALSE,
  ignore_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citations_document ON citations (document_id);
CREATE INDEX IF NOT EXISTS idx_citations_status ON citations (document_id, status);
CREATE INDEX IF NOT EXISTS idx_citations_reference ON citations (matched_reference_id) WHERE matched_reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_citations_authors ON citations USING GIN (extracted_authors);
