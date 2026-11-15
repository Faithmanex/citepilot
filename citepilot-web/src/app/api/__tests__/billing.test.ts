import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const state = vi.hoisted(() => ({
  user: null as { id: string } | null,
  profile: { id: "user-1" } as { id: string } | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user }, error: null }),
    },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: state.profile, error: null }),
        }),
      }),
      upsert: async () => ({ error: null }),
      update: () => ({
        eq: async () => ({ error: null }),
      }),
    }),
  }),
}));

const { POST: activate } = await import("@/app/api/subscription/activate/route");
const { POST: webhook } = await import("@/app/api/webhooks/paypal/route");

function activationRequest(body: unknown): Request {
  return new Request("http://localhost/api/subscription/activate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function webhookRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/webhooks/paypal", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

const originalPlan = process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID;
const originalClient = process.env.PAYPAL_CLIENT_ID;
const originalSecret = process.env.PAYPAL_CLIENT_SECRET;
const originalWebhook = process.env.PAYPAL_WEBHOOK_ID;

beforeEach(() => {
  state.user = null;
  state.profile = { id: "user-1" };
  delete process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID;
  delete process.env.PAYPAL_CLIENT_ID;
  delete process.env.PAYPAL_CLIENT_SECRET;
  delete process.env.PAYPAL_WEBHOOK_ID;
  vi.unstubAllGlobals();
});

afterEach(() => {
  if (originalPlan === undefined) delete process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID;
  else process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID = originalPlan;
  if (originalClient === undefined) delete process.env.PAYPAL_CLIENT_ID;
  else process.env.PAYPAL_CLIENT_ID = originalClient;
  if (originalSecret === undefined) delete process.env.PAYPAL_CLIENT_SECRET;
  else process.env.PAYPAL_CLIENT_SECRET = originalSecret;
  if (originalWebhook === undefined) delete process.env.PAYPAL_WEBHOOK_ID;
  else process.env.PAYPAL_WEBHOOK_ID = originalWebhook;
});

describe("subscription activation fails closed", () => {
  it("refuses activation when billing is not configured", async () => {
    const res = await activate(activationRequest({ subscriptionId: "I-ABC123" }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toMatch(/Billing is not configured/);
  });

  it("refuses activation when PayPal credentials are missing", async () => {
    process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID = "P-TEST";
    state.user = { id: "user-1" };
    const res = await activate(activationRequest({ subscriptionId: "I-ABC123" }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toMatch(/Billing is not configured/);
  });

  it("requires a signed-in user", async () => {
    process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID = "P-TEST";
    process.env.PAYPAL_CLIENT_ID = "client";
    process.env.PAYPAL_CLIENT_SECRET = "secret";
    state.user = null;
    const res = await activate(activationRequest({ subscriptionId: "I-ABC123" }));
    expect(res.status).toBe(401);
  });

  it("rejects a subscription that PayPal reports for another plan", async () => {
    process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID = "P-SOLD";
    process.env.PAYPAL_CLIENT_ID = "client";
    process.env.PAYPAL_CLIENT_SECRET = "secret";
    state.user = { id: "user-1" };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).endsWith("/v1/oauth2/token")) {
          return new Response(JSON.stringify({ access_token: "token" }), { status: 200 });
        }
        return new Response(
          JSON.stringify({ status: "ACTIVE", plan_id: "P-CHEAPER" }),
          { status: 200 }
        );
      })
    );

    const res = await activate(activationRequest({ subscriptionId: "I-ABC123" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/different plan/);
  });

  it("rejects a subscription PayPal does not report as ACTIVE", async () => {
    process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID = "P-SOLD";
    process.env.PAYPAL_CLIENT_ID = "client";
    process.env.PAYPAL_CLIENT_SECRET = "secret";
    state.user = { id: "user-1" };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).endsWith("/v1/oauth2/token")) {
          return new Response(JSON.stringify({ access_token: "token" }), { status: 200 });
        }
        return new Response(
          JSON.stringify({ status: "APPROVAL_PENDING", plan_id: "P-SOLD" }),
          { status: 200 }
        );
      })
    );

    const res = await activate(activationRequest({ subscriptionId: "I-ABC123" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/not ACTIVE/);
  });

  it("activates only after PayPal confirms the sold plan", async () => {
    process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID = "P-SOLD";
    process.env.PAYPAL_CLIENT_ID = "client";
    process.env.PAYPAL_CLIENT_SECRET = "secret";
    state.user = { id: "user-1" };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).endsWith("/v1/oauth2/token")) {
          return new Response(JSON.stringify({ access_token: "token" }), { status: 200 });
        }
        return new Response(
          JSON.stringify({
            status: "ACTIVE",
            plan_id: "P-SOLD",
            start_time: "2026-01-01T00:00:00Z",
            billing_info: { next_billing_time: "2026-02-01T00:00:00Z" },
          }),
          { status: 200 }
        );
      })
    );

    const res = await activate(activationRequest({ subscriptionId: "I-ABC123" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.tier).toBe("professional");
  });
});

describe("PayPal webhook requires a verified signature", () => {
  it("refuses events when no webhook ID is configured", async () => {
    const res = await webhook(
      webhookRequest({ event_type: "BILLING.SUBSCRIPTION.ACTIVATED", resource: { id: "I-1" } })
    );
    expect(res.status).toBe(503);
  });

  it("rejects events without PayPal transmission headers", async () => {
    process.env.PAYPAL_WEBHOOK_ID = "WH-1";
    process.env.PAYPAL_CLIENT_ID = "client";
    process.env.PAYPAL_CLIENT_SECRET = "secret";
    const res = await webhook(
      webhookRequest({ event_type: "BILLING.SUBSCRIPTION.ACTIVATED", resource: { id: "I-1" } })
    );
    expect(res.status).toBe(401);
  });

  it("rejects events whose signature PayPal does not confirm", async () => {
    process.env.PAYPAL_WEBHOOK_ID = "WH-1";
    process.env.PAYPAL_CLIENT_ID = "client";
    process.env.PAYPAL_CLIENT_SECRET = "secret";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).endsWith("/v1/oauth2/token")) {
          return new Response(JSON.stringify({ access_token: "token" }), { status: 200 });
        }
        return new Response(
          JSON.stringify({ verification_status: "FAILURE" }),
          { status: 200 }
        );
      })
    );

    const res = await webhook(
      webhookRequest(
        { event_type: "BILLING.SUBSCRIPTION.ACTIVATED", resource: { id: "I-1" } },
        {
          "paypal-transmission-id": "t-1",
          "paypal-transmission-time": "2026-01-01T00:00:00Z",
          "paypal-cert-id": "c-1",
          "paypal-auth-algo": "SHA256withRSA",
          "paypal-transmission-sig": "sig",
        }
      )
    );
    expect(res.status).toBe(401);
  });
});
