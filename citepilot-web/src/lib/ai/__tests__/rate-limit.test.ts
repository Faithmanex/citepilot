import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const state = vi.hoisted(() => ({
  limit: 2,
  configured: true,
  rpc: null as null | ((
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>),
}));

vi.mock("@/lib/ai/config", () => ({
  aiConfig: {
    apiKey: "",
    get rateLimitPerMinute() {
      return state.limit;
    },
  },
}));

vi.mock("@/lib/supabase/config", () => ({
  get isSupabaseConfigured() {
    return state.configured;
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: (fn: string, args: Record<string, unknown>) => state.rpc!(fn, args),
  }),
}));

const { checkRateLimit } = await import("@/lib/ai/auth");

function request(ip: string): Request {
  return new Request("http://localhost/api/v1/analyse", {
    method: "POST",
    headers: { "x-forwarded-for": `${ip}, 10.0.0.1` },
  });
}

function allowedRow(remaining: number) {
  return {
    data: [
      {
        allowed: true,
        remaining,
        reset_at: new Date(Date.now() + 60_000).toISOString(),
      },
    ],
    error: null,
  };
}

function deniedRow(seconds: number) {
  return {
    data: [
      {
        allowed: false,
        remaining: 0,
        reset_at: new Date(Date.now() + seconds * 1000).toISOString(),
      },
    ],
    error: null,
  };
}

const originalServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

beforeEach(() => {
  state.limit = 2;
  state.configured = true;
  state.rpc = null;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  if (originalServiceRole === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRole;
  vi.restoreAllMocks();
});

describe("shared rate limiter", () => {
  it("allows a request the shared counter accepts", async () => {
    state.rpc = async (fn) => {
      expect(fn).toBe("consume_rate_limit");
      return allowedRow(1);
    };
    await expect(checkRateLimit(request("10.1.1.1"))).resolves.toBeNull();
  });

  it("keys the shared counter by client IP and the configured limit", async () => {
    let seen: Record<string, unknown> = {};
    state.rpc = async (_fn, args) => {
      seen = args;
      return allowedRow(0);
    };
    await checkRateLimit(request("10.1.1.2"));
    expect(seen).toEqual({
      p_key: "analyse:10.1.1.2",
      p_limit: 2,
      p_window_seconds: 60,
    });
  });

  it("rejects with 429 and Retry-After when the shared counter is exhausted", async () => {
    state.rpc = async () => deniedRow(30);
    const response = await checkRateLimit(request("10.1.1.3"));
    expect(response?.status).toBe(429);
    const retryAfter = Number(response?.headers.get("retry-after"));
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });

  it("falls back to the per-instance window when the RPC errors", async () => {
    state.rpc = async () => ({ data: null, error: { message: "relation does not exist" } });
    await expect(checkRateLimit(request("10.1.1.4"))).resolves.toBeNull();
    await expect(checkRateLimit(request("10.1.1.4"))).resolves.toBeNull();
    const third = await checkRateLimit(request("10.1.1.4"));
    expect(third?.status).toBe(429);
  });

  it("falls back to the per-instance window when the admin client throws", async () => {
    state.rpc = async () => {
      throw new Error("fetch failed");
    };
    await checkRateLimit(request("10.1.1.5"));
    await checkRateLimit(request("10.1.1.5"));
    const third = await checkRateLimit(request("10.1.1.5"));
    expect(third?.status).toBe(429);
  });

  it("uses the per-instance window when Supabase is not configured", async () => {
    state.configured = false;
    state.rpc = async () => {
      throw new Error("must not be called");
    };
    await checkRateLimit(request("10.1.1.6"));
    await checkRateLimit(request("10.1.1.6"));
    const third = await checkRateLimit(request("10.1.1.6"));
    expect(third?.status).toBe(429);
  });

  it("is disabled when the configured limit is zero", async () => {
    state.limit = 0;
    state.rpc = async () => deniedRow(30);
    await expect(checkRateLimit(request("10.1.1.7"))).resolves.toBeNull();
  });
});
