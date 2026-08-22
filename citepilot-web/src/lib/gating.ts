export const FREE_TIER_WORD_LIMIT = 1500;

export function countWords(text: string): number {
  if (!text) return 0;
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (!cleaned) return 0;
  return cleaned.split(" ").length;
}

export interface EntitlementCheckResult {
  allowed: boolean;
  reason?: string;
  wordCount: number;
  limit: number;
  requiresUpgrade: boolean;
}

export function checkAuditEntitlement(
  text: string,
  isPro: boolean
): EntitlementCheckResult {
  const wordCount = countWords(text);

  // Pro users have unlimited access
  if (isPro) {
    return {
      allowed: true,
      wordCount,
      limit: Infinity,
      requiresUpgrade: false,
    };
  }

  // Free Tier checks
  if (wordCount > FREE_TIER_WORD_LIMIT) {
    return {
      allowed: false,
      reason: `Your manuscript contains approximately ${wordCount.toLocaleString()} words. The Free Plan allows up to ${FREE_TIER_WORD_LIMIT.toLocaleString()} words per audit. Upgrade to Pro for unlimited length thesis & article auditing.`,
      wordCount,
      limit: FREE_TIER_WORD_LIMIT,
      requiresUpgrade: true,
    };
  }

  return {
    allowed: true,
    wordCount,
    limit: FREE_TIER_WORD_LIMIT,
    requiresUpgrade: false,
  };
}
