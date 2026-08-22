import { describe, it, expect } from "vitest";
import { countWords, checkAuditEntitlement, FREE_TIER_WORD_LIMIT } from "../gating";

describe("gating and entitlement", () => {
  it("counts words accurately for various text inputs", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
    expect(countWords("Hello world")).toBe(2);
    expect(countWords("   This  is   a    multi-spaced  sentence.  ")).toBe(5);
  });

  it("permits free tier audits within word limit", () => {
    const text = new Array(500).fill("word").join(" ");
    const result = checkAuditEntitlement(text, false);
    expect(result.allowed).toBe(true);
    expect(result.requiresUpgrade).toBe(false);
    expect(result.wordCount).toBe(500);
    expect(result.limit).toBe(FREE_TIER_WORD_LIMIT);
  });

  it("blocks free tier audits exceeding 1500 words", () => {
    const text = new Array(1501).fill("word").join(" ");
    const result = checkAuditEntitlement(text, false);
    expect(result.allowed).toBe(false);
    expect(result.requiresUpgrade).toBe(true);
    expect(result.wordCount).toBe(1501);
    expect(result.reason).toContain("Free Plan allows up to");
  });

  it("always permits pro tier audits regardless of word count", () => {
    const text = new Array(25000).fill("word").join(" ");
    const result = checkAuditEntitlement(text, true);
    expect(result.allowed).toBe(true);
    expect(result.requiresUpgrade).toBe(false);
    expect(result.wordCount).toBe(25000);
    expect(result.limit).toBe(Infinity);
  });
});
