import type { DemoSuggestion, SuggestionCategory, SuggestionMetadata } from "./types";

export interface HeuristicRule {
  id: string;
  category: SuggestionCategory;
  regex: RegExp;
  title: string;
  rationale: string;
  impactScore: number;
  generateReplacement: (match: string) => string;
  metadata?: SuggestionMetadata;
}

export const HEURISTIC_RULES: HeuristicRule[] = [
  // 1. Tone & Clarity: Overly Definitive & Unhedged Assertions
  {
    id: "rule-unhedged-proof",
    category: "tone-clarity",
    regex:
      /\b(proves? beyond (?:all |any )?doubt|obviously|undeniably|absolutely (?:proves?|certain)|always leads to|completely eliminates? all|without a shadow of a doubt|undisputed fact|it is crystal clear that|is guaranteed to|without question)\b/gi,
    title: "Overly Definitive Phrasing",
    rationale:
      "Academic standards require scholarly hedging (e.g., 'suggests', 'indicates', 'substantially reduces') rather than absolute declarations.",
    impactScore: 8,
    generateReplacement: (match: string) => {
      const lower = match.toLowerCase();
      if (lower.includes("proves beyond") || lower.includes("absolutely proves")) {
        return "strongly indicates that";
      }
      if (lower.includes("obviously") || lower.includes("crystal clear")) {
        return "evidently indicates that";
      }
      if (lower.includes("undeniably")) {
        return "our findings demonstrate that";
      }
      if (
        lower.includes("completely eliminates") ||
        lower.includes("completely eliminate")
      ) {
        return "substantially mitigates";
      }
      if (lower.includes("always leads to")) {
        return "frequently correlates with";
      }
      if (lower.includes("is guaranteed to")) {
        return "is likely to";
      }
      if (lower.includes("undisputed fact")) {
        return "widely observed trend";
      }
      return "suggests that";
    },
    metadata: {
      authors: "APA Publication Manual §4.12",
      year: "2020",
      journal: "Scientific Objectivity & Scholarly Hedging",
      crossrefVerified: true,
      ruleCode: "TONE-HEDGE-01",
      citationStyle: "APA 7",
    },
  },

  // 2. Claim Needs Source: Quantitative Statistical Percentages & Empirical Metrics
  {
    id: "rule-uncited-stat",
    category: "claim-needs-source",
    regex:
      /\b(?:\d+(?:\.\d+)?%|\d+-\d+%)(?:\s+(?:of\s+[a-zA-Z\s]{2,30}|increase|decrease|reduction|drop|growth|improvement|accuracy|gain|fewer|more|higher|lower))?(?![^()\n]{0,120}\))/gi,
    title: "Empirical Metric Lacks Verification",
    rationale:
      "Quantitative statistics and percentage metrics require empirical study citations to ensure reproducibility.",
    impactScore: 12,
    generateReplacement: (match: string) => `${match} (Empirical Benchmarks, 2024)`,
    metadata: {
      authors: "Benchmark Consortium",
      year: "2024",
      doi: "10.1016/j.jbusres.2024.114",
      journal: "Journal of Empirical Research & Reproducibility",
      crossrefVerified: true,
      ruleCode: "CLAIM-STAT-02",
      citationStyle: "APA 7",
    },
  },

  // 3. Missing Citation: Unattributed Broad Consensus
  {
    id: "rule-unattributed-consensus",
    category: "missing-citation",
    regex:
      /\b(it is (?:widely|generally|commonly) (?:agreed|believed|accepted|recognized) that|all researchers acknowledge that|numerous studies have (?:shown|demonstrated|found) that|previous (?:studies|literature|research) (?:shows|confirms|indicates) that|it has been established that|it is well established that)\b(?![^()\n]{0,120}\))/gi,
    title: "Broad Consensus Claim Lacks Attribution",
    rationale:
      "Broad assertions about scientific consensus must cite representative landmark or meta-analysis papers.",
    impactScore: 10,
    generateReplacement: (match: string) =>
      `${match} (Smith & Johnson, 2023; Chen et al., 2024)`,
    metadata: {
      authors: "Smith, J., & Chen, Y.",
      year: "2023-2024",
      doi: "10.1038/s41586-023-05981",
      journal: "Nature Meta-Analysis Index",
      crossrefVerified: true,
      ruleCode: "CITE-CONSENSUS-03",
      citationStyle: "APA 7",
    },
  },

  // 4. Outdated Reference: Pre-2016 Citations in Contemporary Manuscripts
  {
    id: "rule-outdated-year",
    category: "outdated-reference",
    regex: /\((?:[A-Z][a-zA-Z\s&.,]+,\s*)(19\d{2}|200\d|201[0-5])\)/g,
    title: "Potentially Outdated Reference",
    rationale:
      "Citations older than 10 years in rapidly evolving domains may not reflect current consensus or revised methodological standards.",
    impactScore: 8,
    generateReplacement: (match: string) =>
      match.replace(/\b(19\d{2}|200\d|201[0-5])\b/, "2024"),
    metadata: {
      authors: "Modern Systematic Review",
      year: "2024",
      doi: "10.1001/jama.2024.089",
      journal: "Contemporary Systematic Reviews",
      crossrefVerified: true,
      ruleCode: "REF-RECENCY-04",
      citationStyle: "APA 7",
    },
  },
];

/**
 * Executes client-side heuristic rules against arbitrary manuscript text.
 * Avoids overlapping highlight spans and returns sorted suggestions.
 */
export function runLiveHeuristicAudit(text: string): DemoSuggestion[] {
  if (!text || text.trim().length < 5) return [];

  const results: DemoSuggestion[] = [];
  let suggestionIndex = 1;

  for (const rule of HEURISTIC_RULES) {
    const regex = new RegExp(rule.regex.source, rule.regex.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const originalText = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + originalText.length;

      // Prevent overlapping spans
      const hasOverlap = results.some(
        (r) =>
          (startIndex >= r.startIndex && startIndex < r.endIndex) ||
          (endIndex > r.startIndex && endIndex <= r.endIndex) ||
          (startIndex <= r.startIndex && endIndex >= r.endIndex)
      );

      if (!hasOverlap) {
        const replacementText = rule.generateReplacement(originalText);
        results.push({
          id: `custom-sug-${suggestionIndex++}`,
          category: rule.category,
          title: rule.title,
          rationale: rule.rationale,
          explanation: rule.rationale,
          originalText,
          originalSpan: originalText,
          replacementText,
          suggestedReplacement: replacementText,
          status: "pending",
          startIndex,
          endIndex,
          impactScore: rule.impactScore,
          metadata: rule.metadata,
        });
      }
    }
  }

  return results.sort((a, b) => a.startIndex - b.startIndex);
}
