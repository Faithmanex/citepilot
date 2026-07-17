CREATE TABLE IF NOT EXISTS references (
  id TEXT PRIMARY KEY DEFAULT ('ref_' || encode(gen_random_bytes(12), 'hex')),
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  list_index SMALLINT NOT NULL DEFAULT 0,
  position SMALLINT NOT NULL,
  raw_entry TEXT NOT NULL,
  parsed_authors JSONB NOT NULL DEFAULT '[]',
  parsed_year SMALLINT,
  parsed_title TEXT,
  parsed_journal VARCHAR(500),
  parsed_volume VARCHAR(20),
  parsed_issue VARCHAR(20),
  parsed_pages VARCHAR(50),
  parsed_doi VARCHAR(255),
  parsed_url TEXT,
  parsed_isbn VARCHAR(20),
  parsed_pmid VARCHAR(20),
  reference_type VARCHAR(30) NOT NULL DEFAULT 'unknown' CHECK (reference_type IN ('journal_article', 'book', 'chapter', 'conference', 'thesis', 'website', 'report', 'legal', 'dataset', 'software', 'other', 'unknown')),
  citation_count SMALLINT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cited', 'orphaned')),
  alphabetical_expected SMALLINT,
  alphabetical_correct BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_references_document ON references (document_id);
CREATE INDEX IF NOT EXISTS idx_references_document_list ON references (document_id, list_index, position);
CREATE INDEX IF NOT EXISTS idx_references_doi ON references (parsed_doi) WHERE parsed_doi IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_references_doc_list_pos ON references (document_id, list_index, position);
