import { describe, it, expect } from "vitest";
import mammoth from "mammoth";
import { getDocumentProxy, extractText } from "unpdf";
import { generateCleanDocx, generateRedlineDocx, generatePdfReport } from "../export";
import type { JsonObject } from "../types";

async function docxText(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer });
  return value;
}

async function pdfText(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : text;
}

describe("generated export artifacts", () => {
  const manuscript = `# Introduction

Citation integrity matters (Smith 2020).

References

Smith, J. (2020). Testing citation systems. Journal of Tests.`;

  it("clean DOCX contains the current text, including accepted fixes", async () => {
    const accepted = manuscript.replace("(Smith 2020)", "(Smith, 2020)");
    const buffer = await generateCleanDocx(accepted);
    const text = await docxText(buffer);

    expect(text).toContain("(Smith, 2020)");
    expect(text).toContain("Citation integrity matters");
    expect(text).toContain("Smith, J. (2020)");
  });

  it("annotated DOCX contains the style finding it claims to annotate", async () => {
    const analysis: JsonObject = {
      style_warnings: [
        {
          code: "APA7_COMMA",
          target_text: "(Smith 2020)",
          message: "Missing comma before year.",
        },
      ],
      citations: [{ raw_text: "(Smith 2020)", status: "matched" }],
      uncited_claims: [],
    };
    const buffer = await generateRedlineDocx(manuscript, analysis);
    const text = await docxText(buffer);

    expect(text).toContain("CitePilot Redline Annotated Manuscript");
    expect(text).toContain("APA7_COMMA");
    expect(text).toContain("Missing comma before year.");
    expect(text).toContain("(Smith 2020)");
  });

  it("PDF report states audit context, checks, and unverified references", async () => {
    const analysis: JsonObject = {
      status: "partial",
      mode: "full",
      citation_style: "apa7",
      request_id: "req_export_test",
      elapsed_seconds: 12.4,
      checks: [
        { name: "citations", label: "In-text citation extraction", status: "completed" },
        {
          name: "verification",
          label: "Crossref / OpenAlex verification",
          status: "unavailable",
          message: "Verification timed out.",
        },
      ],
      citations: [{ raw_text: "(Smith 2020)", status: "no_match" }],
      references: [
        {
          raw_entry: "García, M. (2019). Título con acentos — and a dash.",
          status: "cited",
          crossref_validation: { status: "verification_unavailable" },
        },
      ],
      style_warnings: [{ code: "APA7_COMMA", message: "Missing comma before year." }],
      uncited_claims: [],
      recency: { within_5_years_percent: 50 },
    };

    const buffer = await generatePdfReport(analysis);
    const text = await pdfText(buffer);

    expect(text).toContain("CitePilot Diagnostic Citation Audit Report");
    expect(text).toContain("PARTIAL");
    expect(text).toContain("req_export_test");
    expect(text).toContain("Checks Performed");
    expect(text).toContain("Verification timed out");
    expect(text).toContain("Unverified references are not confirmed correct");
    expect(text).toContain("Unmatched citations: 1");
  });

  it("PDF generation survives non-Latin reference text instead of failing the export", async () => {
    const buffer = await generatePdfReport({
      references: [{ raw_entry: "李, 王. (2021). 引用完整性.", status: "retracted" }],
    });
    const text = await pdfText(buffer);
    expect(text).toContain("RETRACTED");
  });
});
