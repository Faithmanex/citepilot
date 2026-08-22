import { describe, it, expect } from "vitest";
import { runLiveHeuristicAudit, HEURISTIC_RULES } from "../nlpRuleEngine";

describe("Client-Side NLP Heuristic Rule Engine (nlpRuleEngine)", () => {
  it("detects unhedged absolute proof phrasing and assigns tone-clarity category", () => {
    const text = "This study obviously proves beyond doubt that our method is optimal.";
    const suggestions = runLiveHeuristicAudit(text);

    expect(suggestions.length).toBeGreaterThan(0);
    const toneSug = suggestions.find((s) => s.category === "tone-clarity");
    expect(toneSug).toBeDefined();
    expect(toneSug?.title).toBe("Overly Definitive Phrasing");
    expect(toneSug?.replacementText).toBeDefined();
  });

  it("detects uncited statistical percentages and assigns claim-needs-source category", () => {
    const text = "Retrieval augmented generation reduces hallucination rates by 38.2% across benchmarks.";
    const suggestions = runLiveHeuristicAudit(text);

    const statSug = suggestions.find((s) => s.category === "claim-needs-source");
    expect(statSug).toBeDefined();
    expect(statSug?.title).toBe("Empirical Metric Lacks Verification");
    expect(statSug?.replacementText).toContain("2024");
    expect(statSug?.metadata?.crossrefVerified).toBe(true);
  });

  it("detects broad consensus claims lacking citations and assigns missing-citation category", () => {
    const text = "It is widely agreed that transformer architectures require extensive pre-training.";
    const suggestions = runLiveHeuristicAudit(text);

    const citeSug = suggestions.find((s) => s.category === "missing-citation");
    expect(citeSug).toBeDefined();
    expect(citeSug?.title).toBe("Broad Consensus Claim Lacks Attribution");
    expect(citeSug?.replacementText).toContain("Smith & Johnson");
  });

  it("detects outdated pre-2016 citations and assigns outdated-reference category", () => {
    const text = "Early target validation followed standard protocols (Urnov et al., 2010).";
    const suggestions = runLiveHeuristicAudit(text);

    const outdatedSug = suggestions.find((s) => s.category === "outdated-reference");
    expect(outdatedSug).toBeDefined();
    expect(outdatedSug?.title).toBe("Potentially Outdated Reference");
    expect(outdatedSug?.replacementText).toContain("2024");
  });

  it("handles empty or very short strings gracefully without crashing", () => {
    expect(runLiveHeuristicAudit("")).toEqual([]);
    expect(runLiveHeuristicAudit("   ")).toEqual([]);
    expect(runLiveHeuristicAudit("Hi.")).toEqual([]);
  });

  it("sorts multiple matched suggestions in sequential ascending order of startIndex", () => {
    const compositeText =
      "It is widely agreed that the approach obviously proves beyond doubt that off-target rates drop by 25.5% (Smith, 2012).";
    const suggestions = runLiveHeuristicAudit(compositeText);

    expect(suggestions.length).toBeGreaterThan(1);
    for (let i = 1; i < suggestions.length; i++) {
      expect(suggestions[i].startIndex).toBeGreaterThanOrEqual(suggestions[i - 1].startIndex);
    }
  });

  it("exports complete suite of 4 heuristic rules with valid regex and replacements", () => {
    expect(HEURISTIC_RULES).toHaveLength(4);
    const categories = HEURISTIC_RULES.map((r) => r.category);
    expect(categories).toContain("tone-clarity");
    expect(categories).toContain("claim-needs-source");
    expect(categories).toContain("missing-citation");
    expect(categories).toContain("outdated-reference");
  });
});
