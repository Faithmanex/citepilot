import { describe, it, expect } from "vitest";
import { checkWordLimit, entitlementForTier } from "@/lib/ai/entitlement";
import { FREE_TIER_WORD_LIMIT } from "@/lib/gating";

describe("audit entitlement", () => {
  it("gives paid tiers an unlimited word budget", () => {
    for (const tier of ["student", "professional", "institutional"]) {
      const entitlement = entitlementForTier(tier);
      expect(entitlement.isPro).toBe(true);
      expect(entitlement.wordLimit).toBe(Infinity);
    }
  });

  it("treats free and unknown tiers as limited", () => {
    for (const tier of ["free", "anonymous", "", "enterprise"]) {
      const entitlement = entitlementForTier(tier);
      expect(entitlement.isPro).toBe(false);
      expect(entitlement.wordLimit).toBe(FREE_TIER_WORD_LIMIT);
    }
  });

  it("allows exactly the limit and rejects one word past it", () => {
    const free = entitlementForTier("free");
    expect(checkWordLimit(word(FREE_TIER_WORD_LIMIT), free).allowed).toBe(true);
    expect(checkWordLimit(word(FREE_TIER_WORD_LIMIT + 1), free).allowed).toBe(false);
  });

  it("counts words the same way the editor does", () => {
    const free = entitlementForTier("free");
    expect(checkWordLimit("  one   two \n three  ", free).wordCount).toBe(3);
  });
});

function word(count: number): string {
  return Array.from({ length: count }, () => "word").join(" ");
}
