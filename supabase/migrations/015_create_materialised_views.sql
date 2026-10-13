-- 015_create_materialised_views.sql
--
-- Ships the §3 reporting views from 03-technical-architecture/13-database-schema.md.
--
-- Best-practice notes:
--   * Refreshes use REFRESH MATERIALIZED VIEW CONCURRENTLY so dashboard reads
--     are never blocked. CONCURRENTLY requires a unique index on each view,
--     which this migration creates before the first schedule runs.
--   * Schedules are idempotent: each job is unscheduled by name before being
--     (re)scheduled, so re-applying this file never creates duplicate jobs.
--   * pg_cron jobs run in the database where the extension is created; keep
--     these schedules in the same database as the views.
--   * Portable: where pg_cron is unavailable the file still applies cleanly —
--     views and indexes are created and only the schedules are skipped.

-- pg_cron ships with Supabase. On servers without the extension files this
-- block only emits a NOTICE; views and indexes below are still created.
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS "pg_cron";
EXCEPTION
  WHEN undefined_file THEN
    RAISE NOTICE 'pg_cron extension files are not available on this server; refresh schedules will be skipped.';
END
$$;

-- ---------------------------------------------------------------------------
-- mv_document_summary — per-document rollups for the results dashboard
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_document_summary') THEN
    CREATE MATERIALIZED VIEW mv_document_summary AS
    SELECT
      d.id AS document_id,
      d.user_id,
      d.citation_style,
      d.status,
      d.word_count,
      COUNT(DISTINCT c.id) AS total_citations,
      COUNT(DISTINCT r.id) AS total_references,
      COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'matched') AS matched,
      COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'possible_match') AS possible_match,
      COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'no_match') AS no_match,
      COUNT(DISTINCT c.id) FILTER (WHERE c.ignored = TRUE) AS ignored,
      COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'orphaned') AS orphaned_references,
      COUNT(DISTINCT sw.id) AS style_warnings,
      COUNT(DISTINCT rr.id) FILTER (WHERE rr.is_retracted = TRUE) AS retraction_flags,
      COUNT(DISTINCT rr.id) FILTER (WHERE rr.is_hallucinated = TRUE) AS hallucination_flags,
      d.created_at
    FROM documents d
    LEFT JOIN citations c ON c.document_id = d.id
    LEFT JOIN "references" r ON r.document_id = d.id
    LEFT JOIN style_warnings sw ON sw.document_id = d.id
    LEFT JOIN reference_results rr ON rr.document_id = d.id
    WHERE d.deleted_at IS NULL
    GROUP BY d.id;
  END IF;
END
$$;

-- Unique index doubles as the CONCURRENTLY-refresh key.
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_doc_summary_id ON mv_document_summary (document_id);
CREATE INDEX IF NOT EXISTS idx_mv_doc_summary_user ON mv_document_summary (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- mv_organisation_analytics — per-org daily rollups for admin dashboards
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_organisation_analytics') THEN
    CREATE MATERIALIZED VIEW mv_organisation_analytics AS
    SELECT
      u.organisation_id,
      DATE(d.created_at) AS date,
      COUNT(DISTINCT d.id) AS documents_processed,
      COUNT(DISTINCT d.user_id) AS active_users,
      SUM(COALESCE(ds.total_citations, 0)) AS citations_checked,
      SUM(COALESCE(ds.no_match, 0) + COALESCE(ds.style_warnings, 0)) AS issues_found,
      d.citation_style AS most_used_style
    FROM documents d
    JOIN users u ON u.id = d.user_id
    LEFT JOIN mv_document_summary ds ON ds.document_id = d.id
    WHERE u.organisation_id IS NOT NULL
      AND d.deleted_at IS NULL
    GROUP BY u.organisation_id, DATE(d.created_at), d.citation_style;
  END IF;
END
$$;

-- Unique index over the full GROUP BY key (required for CONCURRENTLY refresh).
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_org_analytics_uid
  ON mv_organisation_analytics (organisation_id, date, most_used_style);
CREATE INDEX IF NOT EXISTS idx_mv_org_analytics
  ON mv_organisation_analytics (organisation_id, date DESC);

-- ---------------------------------------------------------------------------
-- Refresh schedules (idempotent)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('refresh-doc-summary');
    PERFORM cron.schedule(
      'refresh-doc-summary',
      '*/5 * * * *',
      'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_document_summary'
    );
    PERFORM cron.unschedule('refresh-org-analytics');
    PERFORM cron.schedule(
      'refresh-org-analytics',
      '*/15 * * * *',
      'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_organisation_analytics'
    );
  ELSE
    RAISE NOTICE 'pg_cron not installed: materialised views created without refresh schedules.';
  END IF;
END
$$;
