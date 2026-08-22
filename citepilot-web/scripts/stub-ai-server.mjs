/**
 * Stub AI service for browser verification of the dashboard audit flow.
 *
 * Mimics the real citepilot-ai service (which requires GOOGLE_API_KEY) so the
 * frontend can be exercised end-to-end without calling Gemini or Crossref.
 *
 * Run with: node scripts/stub-ai-server.mjs   (listens on :8000)
 */
import http from "node:http";

const SAMPLE_RESPONSE = {
  mode: "full",
  elapsed_seconds: 1.23,
  citations: [
    {
      raw_text: "(LeCun et al., 2015)",
      paragraph_index: 0,
      char_start: 55,
      char_end: 72,
      context: "Deep learning has driven major advances across artificial intelligence research (LeCun et al., 2015).",
      extracted_authors: ["LeCun"],
      extracted_year: 2015,
      citation_type: "parenthetical",
      status: "matched",
      confidence: 0.98,
      matched_reference_index: 0,
      match_type: "exact",
      issues: [],
    },
    {
      raw_text: "(van der Maaten & Hinton, 2008)",
      paragraph_index: 0,
      char_start: 140,
      char_end: 170,
      context: "Dimensionality reduction methods such as t-SNE remain widely used for visualising high-dimensional data (van der Maaten & Hinton, 2008).",
      extracted_authors: ["van der Maaten", "Hinton"],
      extracted_year: 2008,
      citation_type: "parenthetical",
      status: "no_match",
      confidence: 0.0,
      matched_reference_index: null,
      match_type: "none",
      issues: [],
    },
  ],
  references: [
    {
      raw_entry: "LeCun, Y., Bengio, Y., & Hinton, G. (2015). Deep learning. Nature, 521(7553), 436-444. https://doi.org/10.1038/nature14539",
      position: 1,
      parsed_authors: [{ family: "LeCun", given: "Y." }, { family: "Bengio", given: "Y." }, { family: "Hinton", given: "G." }],
      parsed_year: 2015,
      parsed_title: "Deep learning",
      parsed_journal: "Nature",
      parsed_volume: "521",
      parsed_issue: "7553",
      parsed_pages: "436-444",
      parsed_doi: "10.1038/nature14539",
      parsed_url: null,
      reference_type: "journal_article",
      status: "cited",
      crossref_validation: {
        crossref_verified: true,
        status: "verified",
        crossref_doi: "10.1038/nature14539",
        crossref_title: "Deep learning",
        crossref_journal: "Nature",
        crossref_year: 2015,
        discrepancies: [],
      },
      retraction_info: { is_retracted: false, status: "normal", message: null, how_to_fix: null },
    },
    {
      raw_entry: "Van der Maaten, L., & Hinton, G. (2008). Visualizing data using t-SNE. Journal of Machine Learning Research, 9, 2579-2605.",
      position: 2,
      parsed_authors: [{ family: "Van der Maaten", given: "L." }, { family: "Hinton", given: "G." }],
      parsed_year: 2008,
      parsed_title: "Visualizing data using t-SNE",
      parsed_journal: "Journal of Machine Learning Research",
      parsed_volume: "9",
      parsed_issue: null,
      parsed_pages: "2579-2605",
      parsed_doi: null,
      parsed_url: null,
      reference_type: "journal_article",
      status: "orphaned",
      crossref_validation: {
        crossref_verified: false,
        status: "not_found",
        message: "Reference metadata could not be found in the Crossref database.",
        how_to_fix: "Verify that the author names, publication year, and article title are spelled correctly.",
        discrepancies: [],
      },
      retraction_info: { is_retracted: false, status: "normal", message: null, how_to_fix: null },
    },
  ],
  style_warnings: [
    {
      code: "MISSING_COMMA",
      category: "formatting",
      target_text: "(Smith 2020)",
      message: "Missing comma between author and year.",
      suggestion: "Change to (Smith, 2020).",
      severity: "warning",
    },
  ],
  uncited_claims: [
    {
      code: "UNCITED_FACTUAL_CLAIM",
      category: "citation_needed",
      paragraph_index: 0,
      claim_text: "Deep learning has driven major advances across artificial intelligence research.",
      message: "Uncited Claim: 'Deep learning has driven major advances...' requires a supporting citation marker.",
      educational_context: "Academic style manuals require backing up empirical claims with an explicit in-text reference.",
      suggestion: "Add a supporting in-text citation marker (e.g. Author, Year).",
      severity: "warning",
    },
  ],
  recency: {
    total_parsed_sources: 2,
    valid_year_sources: 2,
    within_3_years_count: 0,
    within_3_years_percent: 0.0,
    within_5_years_count: 0,
    within_5_years_percent: 0.0,
    within_10_years_count: 2,
    within_10_years_percent: 100.0,
    older_than_10_years_count: 0,
    older_than_10_years_percent: 0.0,
    average_publication_year: 2011.5,
    average_source_age_years: 14.5,
    recency_compliance_status: "compliant",
  },
};

// Minimal valid PDF bytes so the export endpoint returns a real downloadable file.
const MINIMAL_PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n171\n%%EOF",
  "latin1"
);

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "citepilot-ai-stub" }));
    return;
  }

  if (req.url === "/api/v1/analyse") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(SAMPLE_RESPONSE));
    return;
  }

  if (req.url === "/api/v1/export/pdf") {
    res.writeHead(200, { "Content-Type": "application/pdf" });
    res.end(MINIMAL_PDF);
    return;
  }

  if (req.url === "/api/v1/export/docx") {
    res.writeHead(200, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    res.end(MINIMAL_PDF);
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ detail: "API endpoint not found" }));
});

server.listen(8000, () => {
  console.log("Stub AI service listening on http://localhost:8000");
});
