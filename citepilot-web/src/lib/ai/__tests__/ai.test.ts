import { describe, it, expect } from "vitest";
import { cleanDoi, titlesMatch, titlesRelated, namesMatch, journalsMatch, volumesMatch, pagesMatch } from "@/lib/ai/crossref";
import { analyzeCrossrefRetraction } from "@/lib/ai/retraction";
import { calculatePublicationRecency } from "@/lib/ai/recency";
import { splitBodyAndReferences, parseTxtStructured } from "@/lib/ai/document-parser";
import { extractJson } from "@/lib/ai/llm";
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

  describe("crossref.titlesMatch", () => {
    it("matches titles that are identical after normalization, without a similarity threshold", () => {
      expect(titlesMatch("Attention is all you need", "Attention Is All You Need!")).toBe(true);
      expect(
        titlesMatch("Deep learning", "Visualizing data using t-SNE")
      ).toBe(false);
      // A near-miss (one differing word) is a discrepancy, not a fuzzy match.
      expect(titlesMatch("Deep learning", "Deep learning advances")).toBe(false);
    });
  });

  describe("crossref.titlesRelated", () => {
    it("accepts a Crossref record that extends the reference title as a subtitle", () => {
      expect(
        titlesRelated(
          "Deep learning for artificial intelligence",
          "Deep learning"
        )
      ).toBe(true);
      expect(
        titlesRelated(
          "Attention is all you need",
          "Attention is all you need: a survey of transformers"
        )
      ).toBe(true);
    });

    it("rejects unrelated search hits so fabricated references stay not_found", () => {
      expect(
        titlesRelated(
          "Zxqvth citation resonance in non-existent underwater libraries",
          "Deep learning"
        )
      ).toBe(false);
      expect(
        titlesRelated("Automated citation auditing: A Review", "ImageNet classification with deep convolutional neural networks")
      ).toBe(false);
    });
  });

  describe("crossref metadata comparisons", () => {
    it("compares author surnames across accents, punctuation, and spacing", () => {
      expect(namesMatch("LeCun", "LeCun")).toBe(true);
      expect(namesMatch("García", "Garcia")).toBe(true);
      expect(namesMatch("O'Brien", "OBrien")).toBe(true);
      expect(namesMatch("LeCun", "LeCunn")).toBe(false);
      expect(namesMatch("Smith", "Jones")).toBe(false);
    });

    it("compares journal names without flagging container-name variants", () => {
      expect(journalsMatch("Nature", "Nature")).toBe(true);
      expect(journalsMatch("Journal of Testing", "Journal of Testing (Online)")).toBe(true);
      expect(journalsMatch("Nature", "Science")).toBe(false);
    });

    it("compares volumes and full page ranges", () => {
      expect(volumesMatch("521", "521")).toBe(true);
      expect(volumesMatch("521", "522")).toBe(false);
      expect(pagesMatch("436-444", "436–444")).toBe(true);
      expect(pagesMatch("436-44", "436-444")).toBe(false);
      expect(pagesMatch("e12345", "e12345")).toBe(true);
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

    it("does not guess retraction from title text alone", () => {
      const res = analyzeCrossrefRetraction({ title: ["Retracted: Some study"] });
      expect(res.is_retracted).toBe(false);
    });

    it("returns normal for works with no retraction relation", () => {
      expect(analyzeCrossrefRetraction({ title: ["A normal paper"] }).is_retracted).toBe(false);
    });
  });

  describe("recency.calculatePublicationRecency", () => {
    it("reports no valid years and no judged compliance tier", () => {
      const res = calculatePublicationRecency([{ parsed_year: null }]);
      expect(res.valid_year_sources).toBe(0);
      expect(res.total_parsed_sources).toBe(1);
      expect(res).not.toHaveProperty("recency_compliance_status");
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
    });

    it("throws instead of silently returning an empty object on malformed output", () => {
      expect(() => extractJson("not json")).toThrow();
      expect(() => extractJson("")).toThrow();
    });
  });

  describe("schemas", () => {
    it("defaults to an empty citations array", () => {
      expect(CitationsResponseSchema.parse({})).toEqual({ citations: [] });
    });
  });
});
