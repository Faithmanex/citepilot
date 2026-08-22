import type { DemoSuggestion, RigorMetrics } from "./types";

/**
 * Determines academic status tier based on overall score.
 * - >= 95: Ready for Journal Submission
 * - 85 - 94: Strong Academic Rigor
 * - 75 - 84: Moderate Verification Needed
 * - < 75: Needs Immediate Attention
 */
export function getStatusLabel(score: number): string {
  if (score >= 95) return "Ready for Journal Submission";
  if (score >= 85) return "Strong Academic Rigor";
  if (score >= 75) return "Moderate Verification Needed";
  return "Needs Immediate Attention";
}

/**
 * Calculates real-time Citation Rigor Score and detailed sub-metrics.
 * Supports both an array of suggestions or total count.
 */
export function calculateRigorScore(
  suggestionsOrTotal: number | DemoSuggestion[],
  acceptedIds: string[] = [],
  dismissedIds: string[] = [],
  baseScore: number = 64,
  wordCount: number = 100
): RigorMetrics {
  const isArray = Array.isArray(suggestionsOrTotal);
  const suggestions: DemoSuggestion[] = isArray ? suggestionsOrTotal : [];
  const totalCount = isArray ? suggestionsOrTotal.length : suggestionsOrTotal;

  const acceptedSet = new Set(acceptedIds);

  const acceptedCount = acceptedIds.length;
  const dismissedCount = dismissedIds.length;
  const resolvedCount = acceptedCount + dismissedCount;
  const unresolvedCount = Math.max(0, totalCount - resolvedCount);

  // If there are zero opportunities
  if (totalCount === 0) {
    if (wordCount >= 15) {
      const overallScore = 98;
      return {
        overallScore,
        sourceCoverage: 100,
        claimIntegrity: 100,
        scholarlyTone: 98,
        totalCount: 0,
        unresolvedCount: 0,
        acceptedCount: 0,
        dismissedCount: 0,
        statusLabel: getStatusLabel(overallScore),
        pointsGained: 0,
        deltaScore: 0,
        isOptimal: true,
      };
    }

    const overallScore = 70;
    return {
      overallScore,
      sourceCoverage: 70,
      claimIntegrity: 70,
      scholarlyTone: 70,
      totalCount: 0,
      unresolvedCount: 0,
      acceptedCount: 0,
      dismissedCount: 0,
      statusLabel: getStatusLabel(overallScore),
      pointsGained: 0,
      deltaScore: 0,
      isOptimal: false,
    };
  }

  // Deficit distribution
  const remainingDeficit = 100 - baseScore;
  const pointsPerOpportunity = remainingDeficit / totalCount;
  const rawPointsGained =
    acceptedCount * pointsPerOpportunity +
    dismissedCount * (pointsPerOpportunity * 0.35);

  const pointsGained = Math.round(rawPointsGained);
  const overallScore = Math.min(
    100,
    Math.max(0, Math.round(baseScore + rawPointsGained))
  );

  let sourceCoverage: number;
  let claimIntegrity: number;
  let scholarlyTone: number;

  if (isArray && suggestions.length > 0) {
    const acceptedMissing = suggestions.filter(
      (s) => acceptedSet.has(s.id) && s.category === "missing-citation"
    ).length;
    const acceptedClaims = suggestions.filter(
      (s) => acceptedSet.has(s.id) && s.category === "claim-needs-source"
    ).length;
    const acceptedOutdated = suggestions.filter(
      (s) => acceptedSet.has(s.id) && s.category === "outdated-reference"
    ).length;
    const acceptedTone = suggestions.filter(
      (s) => acceptedSet.has(s.id) && s.category === "tone-clarity"
    ).length;

    const baseCoverage = Math.max(40, Math.round(baseScore * 0.95));
    sourceCoverage = Math.min(
      100,
      Math.round(
        baseCoverage +
          acceptedMissing * 12 +
          acceptedOutdated * 8 +
          dismissedCount * 3
      )
    );

    const baseIntegrity = Math.max(35, Math.round(baseScore * 0.9));
    claimIntegrity = Math.min(
      100,
      Math.round(baseIntegrity + acceptedClaims * 14 + dismissedCount * 3.5)
    );

    const baseTone = Math.max(60, Math.round(baseScore * 1.1));
    scholarlyTone = Math.min(
      100,
      Math.round(baseTone + acceptedTone * 15 + dismissedCount * 2.5)
    );
  } else {
    sourceCoverage = Math.min(
      100,
      Math.round(65 + acceptedCount * 8.75 + dismissedCount * 3)
    );
    claimIntegrity = Math.min(
      100,
      Math.round(60 + acceptedCount * 10 + dismissedCount * 3.5)
    );
    scholarlyTone = Math.min(
      100,
      Math.round(75 + acceptedCount * 6.25 + dismissedCount * 2.5)
    );
  }

  // Status classification
  const statusLabel = getStatusLabel(overallScore);

  const deltaScore = overallScore - baseScore;
  const isOptimal = overallScore >= 90;

  return {
    overallScore,
    sourceCoverage,
    claimIntegrity,
    scholarlyTone,
    totalCount,
    unresolvedCount,
    acceptedCount,
    dismissedCount,
    statusLabel,
    pointsGained,
    deltaScore,
    isOptimal,
  };
}

