/**
 * Shared health/readiness payload used by both `/health` and `/api/health`.
 */
import { aiConfig, SERVICE_VERSION } from "./config";
import {
  getCachedReadiness,
  getConfigurationReadiness,
  probeProvider,
} from "./readiness";

export async function buildHealthPayload(request: Request) {
  const url = new URL(request.url);
  const wantsProbe = url.searchParams.get("probe") === "1";

  const readiness = wantsProbe
    ? await probeProvider()
    : getCachedReadiness() ?? getConfigurationReadiness();

  return {
    status: "ok",
    service: "citepilot-ai",
    version: SERVICE_VERSION,
    // Honest flags: `ai_engine_ready` is only true after a successful probe.
    ai_engine_ready: readiness.state === "ready",
    ai_configured: Boolean(aiConfig.googleApiKey),
    analysis_available: readiness.state === "ready",
    provider_readiness: readiness,
    model: aiConfig.geminiModel,
    budgets: {
      analysis_ms: aiConfig.analysisBudgetMs,
      provider_call_ms: aiConfig.geminiTimeoutMs,
    },
  };
}
