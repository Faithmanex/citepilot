-- 016: Shared rate limiting.
--
-- The in-memory limiter in `src/lib/ai/auth.ts` only sees requests handled by
-- the same serverless instance, so a caller could exceed the limit by N on a
-- deployment with N instances. This table plus `consume_rate_limit` gives an
-- atomic, deployment-wide counter.
--
-- The function is SECURITY DEFINER so it can update the table while direct
-- table access stays closed to clients: RLS is enabled with no policies, and
-- anon/authenticated have no privileges on either object.

CREATE TABLE IF NOT EXISTS rate_limit_counters (
  bucket_key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket_key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON rate_limit_counters (window_start);

ALTER TABLE rate_limit_counters ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE rate_limit_counters FROM anon, authenticated;

-- Atomically consume one slot in the current fixed window for `p_key`.
-- Returns whether the request is allowed, how many slots remain, and when the
-- window resets (so the route can send Retry-After).
CREATE OR REPLACE FUNCTION consume_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS TABLE (allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  IF p_limit IS NULL OR p_limit <= 0 THEN
    RAISE EXCEPTION 'p_limit must be positive';
  END IF;
  IF p_window_seconds IS NULL OR p_window_seconds <= 0 THEN
    RAISE EXCEPTION 'p_window_seconds must be positive';
  END IF;

  v_window_start := to_timestamp(
    floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO rate_limit_counters (bucket_key, window_start, count)
  VALUES (p_key, v_window_start, 1)
  ON CONFLICT (bucket_key, window_start)
  DO UPDATE SET count = rate_limit_counters.count + 1
  RETURNING count INTO v_count;

  -- Only this key's expired windows: bounded work, unlike a global sweep.
  DELETE FROM rate_limit_counters
  WHERE bucket_key = p_key
    AND window_start < v_window_start - make_interval(secs => p_window_seconds);

  RETURN QUERY
  SELECT
    v_count <= p_limit,
    GREATEST(p_limit - v_count, 0),
    v_window_start + make_interval(secs => p_window_seconds);
END;
$$;

REVOKE ALL ON FUNCTION consume_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION consume_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;
