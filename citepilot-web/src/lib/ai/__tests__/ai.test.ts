import { describe, it, expect } from "vitest";
import { cleanDoi, fuzzyTitleMatch } from "@/lib/ai/crossref";
import { analyzeCrossrefRetraction } from "@/lib/ai/retraction";
import { calculatePublicationRecency } from "@/lib/ai/recency";
import { splitBodyAndReferences, parseTxtStructured } from "@/lib/ai/document-parser";
import { extractJson } from "@/lib/ai/llm";
import { buildJevQuestionPayload, isJevEnabled } from "@/lib/ai/jev";
import { CitationsResponseSchema } from "@/lib/ai/schemas";

describe("AI service port — pure helpers", () => {
  describe("crossref.cleanDoi", () => {
    it("normalizes prefixed and URL DOIs", () => {
      expect(cleanDoi("doi:10.1038/nature14539")).toBe("10.1038/nature14539");
      expect(cleanDoi("https://doi.org/10.1038/nature14539")).toBe("10.1038/nature14539");
      expect(cleanDoi("https://dx.doi.org/10.1000/xyz.")).toBe("10.1000/xyz");
      expect(cleanDoi("")).toBe("");
    });
  });

  describe("crossref.fuzzyTitleMatch", () => {
    it("matches titles ignoring stop words and punctuation", () => {
      expect(fuzzyTitleMatch("Attention is all you need", "Attention Is All You Need!")).toBe(true);
      expect(
        fuzzyTitleMatch("Deep learning", "Visualizing data using t-SNE")
      ).toBe(false);
    });
  });

  describe("retraction.analyzeCrossrefRetraction", () => {
    it("flags is-retracted-by relations", () => {
      const res = analyzeCrossrefRetraction({
        relation: { "is-retracted-by": [{ id: "10.1/notice" }] },
      });
      expect(res.is_retracted).toBe(true);
      expect(res.notice_doi).toBe("10.1/notice");
    });

    it("flags expression of concern updates", () => {
      const res = analyzeCrossrefRetraction({
        "update-to": [{ label: "Expression of Concern", DOI: "10.1/eoc" }],
      });
      expect(res.is_retracted).toBe(true);
      expect(res.status).toBe("expression_of_concern");
    });

    it("flags retracted title prefixes", () => {
      const res = analyzeCrossrefRetraction({ title: ["Retracted: Some study"] });
      expect(res.is_retracted).toBe(true);
    });

    it("returns normal for clean works", () => {
      expect(analyzeCrossrefRetraction({ title: ["A normal paper"] }).is_retracted).toBe(false);
    });
  });

  describe("recency.calculatePublicationRecency", () => {
    it("returns insufficient_data for no parseable years", () => {
      const res = calculatePublicationRecency([{ parsed_year: null }]);
      expect(res.recency_compliance_status).toBe("insufficient_data");
      expect(res.total_parsed_sources).toBe(1);
    });

    it("computes distribution percentages against total references", () => {
      const year = new Date().getFullYear();
      const res = calculatePublicationRecency([
        { parsed_year: year },
        { parsed_year: year - 4 },
        { parsed_year: 1990 },
      ]);
      expect(res.total_parsed_sources).toBe(3);
      expect(res.within_5_years_count).toBe(2);
      expect(res.within_5_years_percent).toBeCloseTo(66.7, 1);
      expect(res.older_than_10_years_count).toBe(1);
    });
  });

  describe("document-parser.splitBodyAndReferences", () => {
    it("splits a long document at the References heading", () => {
      const body = "Intro paragraph. ".repeat(200);
      const text = `${body}\n\nReferences\nSmith, J. (2020). A study. Journal, 1, 1-2.`;
      const { bodyText, refText } = splitBodyAndReferences(text);
      expect(bodyText).toContain("Intro paragraph.");
      expect(refText.startsWith("Smith, J.")).toBe(true);
    });

    it("falls back to full text when no references heading exists", () => {
      const text = "Just a short body without a bibliography.";
      const { bodyText, refText } = splitBodyAndReferences(text);
      expect(bodyText).toBe(text);
      expect(refText).toBe(text);
    });
  });

  describe("document-parser.parseTxtStructured", () => {
    it("indexes non-empty paragraphs", () => {
      const meta = parseTxtStructured("First.\n\n\n\nSecond.");
      expect(meta.map((m) => m.text)).toEqual(["First.", "Second."]);
      expect(meta[1].paragraph_index).toBe(1);
    });
  });

  describe("llm.extractJson", () => {
    it("parses direct, fenced, and embedded JSON", () => {
      expect(extractJson('{"a":1}')).toEqual({ a: 1 });
      expect(extractJson("```json\n{\"b\":2}\n```")).toEqual({ b: 2 });
      expect(extractJson("noise {\"c\":3} trailing")).toEqual({ c: 3 });
      expect(extractJson("not json")).toEqual({});
    });
  });

  describe("jev (fail-open, disabled by default)", () => {
    it("is disabled without a configured key", () => {
      expect(isJevEnabled()).toBe(false);
    });

    it("exposes the citation_check choice payload", () => {
      const payload = buildJevQuestionPayload() as {
        relation: { type: string; criteria: Record<string, string> };
      };
      expect(payload.relation.type).toBe("choice");
      expect(payload.relation.criteria.supports).toBeTruthy();
    });
  });

  describe("schemas", () => {
    it("defaults to an empty citations array", () => {
      expect(CitationsResponseSchema.parse({})).toEqual({ citations: [] });
    });
  });
});
