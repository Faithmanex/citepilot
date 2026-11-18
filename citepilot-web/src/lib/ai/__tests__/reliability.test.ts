import { describe, it, expect, vi } from "vitest";
import { normalizeCitationStyle } from "../config";
import { classifyProviderError, AIServiceError } from "../llm";
import { rtfToPlainText, bibtexToPlainText } from "../document-parser";
import { getConfigurationReadiness } from "../readiness";
import { buildHealthPayload } from "../health";
import { getJson, HttpError } from "../http";

describe("provider error classification", () => {
  it("does not retry rejected credentials", () => {
    const error = classifyProviderError(
      new Error("API key not valid. Please pass a valid API key.")
    );
    expect(error.kind).toBe("invalid_config");
    expect(error.retryable).toBe(false);
  });

  it("treats a quota failure returned as 403 as a rate limit, not misconfiguration", () => {
    // Regression: providers can surface RESOURCE_EXHAUSTED with HTTP 403 or
    // with quota JSON that contains 401/403-looking values. This used to be
    // reported as "not configured, retrying will not help".
    const error = classifyProviderError({
      status: 403,
      message:
        '{"error":{"code":403,"status":"RESOURCE_EXHAUSTED","message":"You exceeded your current quota. Quota exceeded for metric: generate_content_free_tier_requests"}}',
    });
    expect(error.kind).toBe("rate_limit");
    expect(error.retryable).toBe(true);
  });

  it("still treats explicit permission denial as invalid configuration", () => {
    const error = classifyProviderError({
      status: 403,
      message: "PERMISSION_DENIED: the caller does not have permission.",
    });
    expect(error.kind).toBe("invalid_config");
    expect(error.retryable).toBe(false);
  });

  it("does not read digits inside a message as an HTTP status", () => {
    const error = classifyProviderError(
      new Error("request 40123 failed while streaming")
    );
    expect(error.kind).toBe("provider_error");
    expect(error.retryable).toBe(true);
  });

  it("classifies timeouts and rate limits as retryable", () => {
    expect(classifyProviderError(new Error("DEADLINE_EXCEEDED")).kind).toBe("timeout");
    expect(classifyProviderError(new Error("DEADLINE_EXCEEDED")).retryable).toBe(true);
    expect(classifyProviderError(new Error("RESOURCE_EXHAUSTED: quota")).kind).toBe(
      "rate_limit"
    );
    expect(classifyProviderError({ status: 429, message: "too many" }).retryable).toBe(
      true
    );
  });

  it("keeps existing AIServiceError instances intact", () => {
    const original = new AIServiceError("budget gone", {
      kind: "budget_exhausted",
      retryable: false,
    });
    expect(classifyProviderError(original)).toBe(original);
  });
});

describe("provider HTTP failures", () => {
  it("never leaks an API key from the request URL into the error message", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ error: "over budget", reason: "daily_budget", message: "Daily budget spent." }),
          { status: 429, headers: { "content-type": "application/json" } }
        )
    ) as unknown as typeof fetch;

    try {
      const error = await getJson(
        "https://api.openalex.org/works?api_key=secret-openalex-key&filter=x"
      ).catch((caught) => caught);

      expect(error).toBeInstanceOf(HttpError);
      expect(String(error.message)).not.toContain("secret-openalex-key");
      expect(String(error.message)).toContain("api_key=***");
      expect(String(error.message)).toContain("Daily budget spent.");
      expect(error.reason).toBe("daily_budget");
      // A spent daily budget will not clear inside a retry window.
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("retries a per-second rate limit and honours Retry-After", async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ reason: "requests_per_second", message: "Slow down." }),
          { status: 429, headers: { "content-type": "application/json", "retry-after": "0" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    try {
      const data = await getJson("https://api.openalex.org/works?api_key=k");
      expect(data).toEqual({ ok: true });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("citation style normalization", () => {
  it("maps the legacy client key to a server-accepted style", () => {
    expect(normalizeCitationStyle("chicago17")).toBe("chicago-author-date");
    expect(normalizeCitationStyle("APA7")).toBe("apa7");
  });

  it("rejects unknown styles instead of silently sending them", () => {
    expect(normalizeCitationStyle("made-up")).toBeNull();
  });
});

describe("RTF and BibTeX parsing", () => {
  it("extracts readable text from RTF", () => {
    const rtf = String.raw`{\rtf1\ansi{\fonttbl{\f0 Times;}}\f0 Introduction\par
Smith (2020) argued that {\i citation integrity} matters.\par
References\par
Smith, J. (2020). Testing. Journal of Tests.}`;
    const text = rtfToPlainText(rtf);
    expect(text).toContain("Introduction");
    expect(text).toContain("citation integrity");
    expect(text).toContain("Smith, J. (2020)");
    expect(text).not.toContain("fonttbl");
    expect(text).not.toContain("\\par");
  });

  it("converts BibTeX entries into reference-list text", () => {
    const bib = `@article{smith2020,
  author = {Smith, John and Doe, Jane},
  title = {Testing Citation Systems},
  journal = {Journal of Tests},
  year = {2020},
  volume = {12},
  pages = {1--10},
  doi = {10.1000/abc}
}`;
    const text = bibtexToPlainText(bib);
    expect(text).toContain("Smith, John");
    expect(text).toContain("Doe, Jane");
    expect(text).toContain("2020");
    expect(text).toContain("Testing Citation Systems");
    expect(text).toContain("https://doi.org/10.1000/abc");
  });
});

describe("health readiness contract", () => {
  it("never presents key configuration as provider readiness", () => {
    const readiness = getConfigurationReadiness();
    expect(readiness.state).not.toBe("ready");
    expect(readiness.source).toBe("configuration");
  });

  it("reports liveness separately from analysis availability", async () => {
    const payload = await buildHealthPayload(new Request("http://localhost/api/health"));
    expect(payload.status).toBe("ok");
    expect(payload.ai_engine_ready).toBe(payload.provider_readiness.state === "ready");
    expect(payload.analysis_available).toBe(payload.ai_engine_ready);
    expect(payload.provider_readiness.state).not.toBe("ready");
  });
});
