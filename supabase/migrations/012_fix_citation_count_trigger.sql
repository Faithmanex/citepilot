DROP FUNCTION IF EXISTS trigger_update_citation_count() CASCADE;

CREATE OR REPLACE FUNCTION trigger_update_citation_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE "references" SET citation_count = (
      SELECT COUNT(*) FROM citations WHERE matched_reference_id = NEW.matched_reference_id
    ) WHERE id = NEW.matched_reference_id;
  END IF;
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    UPDATE "references" SET citation_count = (
      SELECT COUNT(*) FROM citations WHERE matched_reference_id = OLD.matched_reference_id
    ) WHERE id = OLD.matched_reference_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_citation_count AFTER INSERT OR UPDATE OR DELETE ON citations
  FOR EACH ROW EXECUTE FUNCTION trigger_update_citation_count();
