/**
 * Publication recency distribution.
 * Port of `citepilot-ai/src/citepilot_ai/services/recency_service.py`.
 */
import type { JsonObject } from "./types";

export function calculatePublicationRecency(
  references: Array<{ parsed_year?: number | null; [key: string]: unknown }>
): JsonObject {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];

  for (const ref of references) {
    const yr = ref.parsed_year;
    if (yr !== null && yr !== undefined) {
      const yrInt = Number(String(yr).trim());
      if (Number.isInteger(yrInt) && yrInt >= 1800 && yrInt <= currentYear + 1) {
        years.push(yrInt);
      }
    }
  }

  const totalParsedSources = references.length;

  if (years.length === 0 || totalParsedSources === 0) {
    return {
      total_parsed_sources: totalParsedSources,
      valid_year_sources: years.length,
      within_3_years_count: 0,
      within_3_years_percent: 0.0,
      within_5_years_count: 0,
      within_5_years_percent: 0.0,
      within_10_years_count: 0,
      within_10_years_percent: 0.0,
      older_than_10_years_count: 0,
      older_than_10_years_percent: 0.0,
      average_publication_year: null,
      average_source_age_years: null,
      recency_compliance_status: "insufficient_data",
    };
  }

  const validCount = years.length;
  const w3 = years.filter((y) => currentYear - y <= 3).length;
  const w5 = years.filter((y) => currentYear - y <= 5).length;
  const w10 = years.filter((y) => currentYear - y <= 10).length;
  const older = years.filter((y) => currentYear - y > 10).length;

  const avgYr = round1(years.reduce((a, b) => a + b, 0) / validCount);
  const avgAge = round1(currentYear - avgYr);

  const p3 = round1((w3 / totalParsedSources) * 100);
  const p5 = round1((w5 / totalParsedSources) * 100);
  const p10 = round1((w10 / totalParsedSources) * 100);
  const pOlder = round1((older / totalParsedSources) * 100);

  let compliance: string;
  if (p5 >= 50.0) compliance = "highly_recent";
  else if (p10 >= 70.0) compliance = "compliant";
  else compliance = "dated_sources_warning";

  return {
    total_parsed_sources: totalParsedSources,
    valid_year_sources: validCount,
    within_3_years_count: w3,
    within_3_years_percent: p3,
    within_5_years_count: w5,
    within_5_years_percent: p5,
    within_10_years_count: w10,
    within_10_years_percent: p10,
    older_than_10_years_count: older,
    older_than_10_years_percent: pOlder,
    average_publication_year: avgYr,
    average_source_age_years: avgAge,
    recency_compliance_status: compliance,
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
