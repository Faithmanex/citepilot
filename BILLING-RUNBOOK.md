# Billing Runbook — PayPal Subscriptions

CitePilot sells one plan (`NEXT_PUBLIC_PAYPAL_PLAN_ID`) and grants the
`professional` tier. Everything below fails **closed**: when a variable, a
signature, or a PayPal status is missing, access is denied rather than granted.

Related code:

| File | Responsibility |
|---|---|
| `citepilot-web/src/app/api/subscription/activate/route.ts` | After the PayPal button approves, verifies the subscription with PayPal and persists it |
| `citepilot-web/src/app/api/webhooks/paypal/route.ts` | Signature-verified lifecycle events |
| `citepilot-web/src/lib/ai/entitlement.ts` | Server-side tier resolution and lazy expiry, enforced by `/api/v1/analyse` |
| `citepilot-web/src/lib/auth/AuthContext.tsx` | Client view of the same entitlement |

---

## 0. Required environment variables

Set these in the Vercel project (Production **and** Preview). A missing value
disables checkout; it never downgrades to a free grant.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | PayPal JS SDK (browser) |
| `NEXT_PUBLIC_PAYPAL_PLAN_ID` | The **sold** plan. Activation rejects any other plan |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | Server-side verification and webhook replay |
| `PAYPAL_WEBHOOK_ID` | Webhook endpoint ID. Missing → every webhook returns 503 |
| `PAYPAL_API_BASE` | Optional. `https://api-m.sandbox.paypal.com` for sandbox, default live |
| `SUPABASE_SERVICE_ROLE_KEY` | Writes `subscriptions` / `users` past RLS |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project |

After changing any of them: `npx vercel --prod` **from the monorepo root**
(Root Directory is `citepilot-web/`; do not `cd` into it).

---

## 1. Verify a user's subscription

Supabase SQL editor:

```sql
SELECT u.id            AS profile_id,
       u.auth_user_id,
       u.email,
       u.tier,
       s.status,
       s.tier             AS subscription_tier,
       s.paypal_subscription_id,
       s.paypal_plan_id,
       s.current_period_end,
       s.cancel_at_period_end
FROM users u
LEFT JOIN subscriptions s ON s.user_id = u.id
WHERE u.auth_user_id = '<auth-user-uuid>';
```

What the server actually enforces (`resolveAuditEntitlement`):

1. No Supabase session → free limit (1,500 words).
2. Profile missing or unreadable → free limit.
3. `subscriptions` row absent → the profile tier is trusted (institutional /
   manually granted accounts).
4. Row present and `status = 'active'` → paid while `current_period_end` is null
   or in the future.
5. Row present and status not active (cancelled/suspended/expired) → paid only
   until `current_period_end`.

Cross-check against PayPal:

```bash
# token
curl -s -X POST "$PAYPAL_API_BASE/v1/oauth2/token" \
  -u "$PAYPAL_CLIENT_ID:$PAYPAL_CLIENT_SECRET" \
  -d grant_type=client_credentials | jq -r .access_token

# subscription
curl -s "$PAYPAL_API_BASE/v1/billing/subscriptions/<I-XXXX>" \
  -H "Authorization: Bearer <token>" | jq '{status, plan_id, billing_info}'
```

The DB and PayPal must agree on `status`, `plan_id`, and `next_billing_time`.
If PayPal says `ACTIVE` but the DB row is missing, the activation call never
completed — replay activation or the webhook (§2).

---

## 2. Replay a webhook

**Preferred:** PayPal dashboard → Developer → Webhooks → the endpoint → *Resend*
for the failed event. This produces a correctly signed delivery.

Manual replay is only for a locally captured payload. Every delivery must carry
`paypal-transmission-id`, `paypal-transmission-time`, `paypal-cert-id`,
`paypal-auth-algo`, `paypal-transmission-sig`, and a `paypal-webhook-id` equal to
`PAYPAL_WEBHOOK_ID`. The route verifies them against PayPal's
`/v1/notifications/verify-webhook-signature`; it does **not** trust `NODE_ENV`.

Handled events:

| Event | Effect |
|---|---|
| `BILLING.SUBSCRIPTION.ACTIVATED`, `BILLING.SUBSCRIPTION.RE-ACTIVATED` | Upsert subscription, tier `professional` |
| `PAYMENT.SALE.COMPLETED` | Resolves the subscription from `billing_agreement_id` (not `resource.id`, which is the sale) |
| `BILLING.SUBSCRIPTION.CANCELLED` / `SUSPENDED` / `EXPIRED` | Status `cancelled`; tier kept until `current_period_end` if still in the future, otherwise downgraded to `free` |

To confirm a webhook was applied, compare `subscriptions.updated_at` against the
event time and check that `tier`/`status` match the event.

---

## 3. Downgrade a user (support action)

Only after confirming in PayPal that the subscription is cancelled or refunded.

```sql
-- 1. Record the cancellation without pretending the paid period ended early.
UPDATE subscriptions
SET status = 'cancelled',
    cancel_at_period_end = TRUE,
    tier = 'free',
    updated_at = NOW()
WHERE paypal_subscription_id = '<I-XXXX>';

-- 2. Drop the profile tier. Entitlement resolution applies expiry lazily, but
--    an explicit downgrade is required for an immediate support revocation.
UPDATE users
SET tier = 'free',
    updated_at = NOW()
WHERE id = (SELECT user_id FROM subscriptions WHERE paypal_subscription_id = '<I-XXXX>');
```

For an **immediate** revocation (fraud/chargeback), also clear the period end so
`isStillPaid` cannot keep the account paid:

```sql
UPDATE subscriptions
SET current_period_end = NOW()
WHERE paypal_subscription_id = '<I-XXXX>';
```

Never hand-edit `users.tier` upward. A paid tier must come from an ACTIVE PayPal
subscription for `NEXT_PUBLIC_PAYPAL_PLAN_ID`; the UI reads the same rows, so a
manual grant also fails to render as Pro.

---

## 4. Common failures

| Symptom | Cause | Action |
|---|---|---|
| `503 Billing is not configured…` | One of the PayPal env vars is unset | Set it, redeploy |
| `400 … belongs to a different plan` | Sandbox/live plan mismatch between the button and `NEXT_PUBLIC_PAYPAL_PLAN_ID` | Align the variables |
| `400 … is not ACTIVE` | Approval not captured yet | Wait, then retry activation. Do not grant manually |
| Checkout succeeds, tier stays `free` | Activation request failed after approval | Replay activation; check Vercel logs for `subscriptions upsert failed` |
| Webhooks return `503` | `PAYPAL_WEBHOOK_ID` missing | Set it, redeploy, resend from PayPal |
| Webhooks return `401` | Signature verification failed or headers stripped by a proxy | Resend from PayPal; confirm the endpoint URL matches the configured one |
| User sees Pro but the API returns `403 word_limit_exceeded` | UI state stale, or the subscription period has ended | Reload; verify §1 |

---

## 5. Tests

```bash
# from citepilot-web/
npm test -- src/app/api/__tests__/billing.test.ts
```

Covers: 503 without a plan, 503 without credentials, 401 without a session, plan
mismatch, non-ACTIVE subscription, successful activation, webhook 503 without a
webhook ID, 401 without transmission headers, 401 when PayPal rejects the
signature.
