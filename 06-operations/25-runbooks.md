# Operational Runbooks

**CitePilot — AI-Powered Citation Consistency Checker**

**Last Updated:** 2026-08-11

> **Revision:** Supersedes the July 2026 version (AWS ECS/RDS/Redis procedures). CitePilot infrastructure is now entirely platform-managed: **Vercel** (web + Postgres), **Railway** (gateway + AI service), **Google Gemini**, **Crossref**, **PayPal**. There is no AWS, no Kubernetes, no Redis, no BullMQ.

---

## Overview

Each runbook below is self-contained and can be followed by any engineer. Procedures assume access to: the `citepilot` GitHub organisation, the Vercel dashboard, the Railway dashboard, the Google AI Studio dashboard, and the PayPal dashboard. Alerting is platform-native (Railway/Vercel deployment notifications via Discord integration); there is no PagerDuty or Datadog — monitoring is roadmap (`04-engineering-standards/20-monitoring-observability.md`).

**Prerequisites:**
- GitHub access to `citepilot-web`, `citepilot-gateway`, `citepilot-ai` (the monorepo docs here are documentation/reference)
- Vercel (web project admin) + Railway (service admin) dashboard access
- `vercel` CLI and Node 22 (`citepilot-web/`)
- Railway dashboard or `railway` CLI (`citepilot-ai/`, `citepilot-gateway/`)

---

## Table of Contents

1. [Deploy a New Release](#1-deploy-a-new-release)
2. [Rollback a Failed Deployment](#2-rollback-a-failed-deployment)
3. [Handle Database Migration](#3-handle-database-migration)
4. [Restart a Crashed Service](#4-restart-a-crashed-service)
5. [Rotate API Keys and Secrets](#5-rotate-api-keys-and-secrets)
6. [Redeploy After Environment Variable Changes](#6-redeploy-after-environment-variable-changes)
7. [Investigate Slow AI Inference](#7-investigate-slow-ai-inference)
8. [Handle Crossref API Outage](#8-handle-crossref-api-outage)
9. [Respond to a Data Deletion Request](#9-respond-to-a-data-deletion-request)
10. [Verify CORS Allowlist After Adding a Domain](#10-verify-cors-allowlist-after-adding-a-domain)

---

## 1. Deploy a New Release

**When to use:** Deploying a new version of any CitePilot service to production.

**Estimated time:** 15–30 minutes · **Risk level:** Medium

### Pre-Deployment Checklist

- [ ] CI checks pass on `main`: `npm run typecheck` + `npm test` (web); gateway/AI test suites (Vitest / pytest)
- [ ] `npm run lint` is **not** part of CI (Next 16 removed `next lint`; there is no `eslint.config.*` in the web repo)
- [ ] Preview deployment (Vercel) smoke-tested on a real document
- [ ] Database migrations reviewed and tested (see [Runbook 3](#3-handle-database-migration))
- [ ] No active SEV1/SEV2 incidents (see `26-incident-response.md`)

### Procedure

**Step 1 — Web (Vercel):**

```bash
cd citepilot-web
npx vercel --prod
```

**Step 2 — Gateway and AI (Railway):**

Trigger deploy from the Railway dashboard (connected GitHub repo) or:

```bash
cd citepilot-ai
railway up
```

**Step 3 — Post-deployment smoke test:**

1. Landing page loads at `https://citepilot.com`
2. Upload `tests/fixtures/sample-apa7.docx`-style document in the dashboard; audit completes
3. Export both PDF and annotated DOCX
4. `curl https://<ai-service-domain>/health` returns `200`

**Step 4 — Monitor for 30 minutes:** Railway logs (gateway/AI request errors, Gemini `429`s), Vercel deployment logs, Discord deployment notifications. Announce in the team channel.

### Rollback Trigger

Initiate [Runbook 2](#2-rollback-a-failed-deployment) if error rate is elevated, audits fail, or exports break.

---

## 2. Rollback a Failed Deployment

**When to use:** A production deployment introduced a critical issue that cannot be hotfixed quickly.

**Estimated time:** 5–15 minutes · **Risk level:** High — act quickly, communicate clearly

### Procedure

**Step 1 — Web (Vercel):**

1. Vercel dashboard → project → **Deployments**
2. Find the last **promoted** production deployment (or a known-good preview)
3. Deployments → `⋮` → **Promote to Production**

**Step 2 — AI / Gateway (Railway):**

1. Railway dashboard → service → **Deployments** tab
2. Find the previous green deployment → **Redeploy**

**Step 3 — If the release included database migrations:**

Do **not** automatically roll back migrations. If the migration was additive (new tables/columns) the old code is compatible. If breaking, restore `DATABASE_URL` from a pre-migration backup (see [Runbook 3](#3-handle-database-migration) rollback section).

**Step 4 — Verify:** re-run smoke tests (Runbook 1, Step 3). Announce rollback in the team channel and open a post-mortem issue per `26-incident-response.md` §4.

---

## 3. Handle Database Migration

**When to use:** A release includes schema changes (Vercel Postgres).

**Estimated time:** 10–60 minutes · **Risk level:** High

### Pre-Migration Checklist

- [ ] Migration SQL reviewed by 2 engineers
- [ ] Migration tested against dev/staging Vercel Postgres with representative data
- [ ] Backwards compatibility verified (current code works with new schema)
- [ ] Backup taken immediately before applying (Step 1)

### Procedure

**Step 1 — Manual backup (Vercel dashboard):** Database → Backups → **Create backup** (or rely on Vercel's automatic daily backups; for schema changes take a manual one).

**Step 2 — Apply migrations.** Migrations live in `supabase/migrations/*.sql` (12 files, numbered). Apply in order using the gateway's Drizzle tooling against production `DATABASE_URL`:

```bash
cd citepilot-gateway
DATABASE_URL="postgresql://..." npx drizzle-kit migrate
```

**Step 3 — Verify:** `SELECT` against new tables; `/health/deep` returns `200`; watch Railway logs for query errors.

### Migration Rollback

1. If the migration is breaking, restore the pre-migration backup: Vercel dashboard → Backups → **Restore** (creates a new instance).
2. Update `DATABASE_URL` on the gateway service to the restored instance, then redeploy (see [Runbook 6](#6-redeploy-after-environment-variable-changes)).

---

## 4. Restart a Crashed Service

**When to use:** A service (web, gateway, or AI) is unresponsive or crash-looping.

**Estimated time:** 5–10 minutes · **Risk level:** Low–Medium

### Procedure

**Step 1 — Web (Vercel):** Deployments → `⋮` → **Redeploy** the current production deployment. Vercel functions are stateless — redeploying clears function crashes.

**Step 2 — AI / Gateway (Railway):**

1. Railway dashboard → service → **Deployments** → **Redeploy** (platform restarts the container).
2. If crash-looping after the *latest* change, use [Runbook 2](#2-rollback-a-failed-deployment) instead.

**Step 3 — Check logs:** Railway → service → **Logs**; look for:
- `OutOfMemoryError` / memory limit → document size issue; check 50 MB upload cap (`citepilot-ai/src/config.py` `MAX_UPLOAD_SIZE_MB`)
- Connection/`ConfigError` → missing or mis-set env vars → [Runbook 6](#6-redeploy-after-environment-variable-changes)
- Unhandled exceptions → app bug → hotfix or rollback

**Step 4 — Verify:** `curl https://<ai-service-domain>/health` → `200`; test audit flow.

---

## 5. Rotate API Keys and Secrets

**When to use:** Scheduled rotation (Gemini key every 90 days, PayPal credentials every 180 days), suspected compromise, or departing team member with access.

**Estimated time:** 15–30 minutes · **Risk level:** Medium

### Secrets Inventory

| Secret | Location | Rotation Frequency |
|---|---|---|
| `GOOGLE_API_KEY` (Gemini) | Railway env var (`citepilot-ai`) | 90 days |
| PayPal client ID / secret + plan ID | Web env vars (Vercel) + gateway | 180 days |
| `DATABASE_URL` | Railway env var (`citepilot-gateway`) | On credential exposure |
| Vercel/Railway platform tokens | Platform dashboards | On exposure / member offboarding |

### Procedure (Example: Gemini API Key)

**Step 1:** Generate a new key in Google AI Studio (https://aistudio.google.com) — name it `citepilot-prod-YYYYMMDD`.

**Step 2:** Railway → `citepilot-ai` → **Variables** → update `GOOGLE_API_KEY`.

**Step 3:** **Always redeploy immediately** — Railway applies env vars on next deploy: Railway → service → **Deploy** (or [Runbook 6](#6-redeploy-after-environment-variable-changes)).

**Step 4:** Verify with a test audit (Gemini call succeeds — check Railway logs for `200` responses).

**Step 5:** Delete the old key in AI Studio. Log the rotation (date, who, reason, old key id) in the team's secret log.

---

## 6. Redeploy After Environment Variable Changes

**When to use:** Any env var change — new API key, changed `DATABASE_URL`, toggled `PAYWALL_ENABLED`, CORS allowlist update.

**Steps:**
1. **Web:** Vercel project → Settings → Environment Variables → save → re-deploy production (`npx vercel --prod`).
2. **Gateway / AI:** Railway → service → Variables → save → **trigger a redeploy** (env changes only take effect on the next deploy).
3. Verify all changed functionality + `GET /health` and `/health/deep`.

---

## 7. Investigate Slow AI Inference

**When to use:** Users report slow audits, or average latency exceeds the targets in `14-ai-nlp-design.md` §8 (5–15 s short docs; 2–3 min thesis-length).

**Estimated time:** 15–45 minutes · **Risk level:** Low (investigation)

### Diagnostic Procedure

**Step 1 — Check Gemini status / quota:** https://status.ai.google.dev — an active incident means the issue is upstream. Check Google AI Studio quotas page for `429`s.

**Step 2 — Check Railway logs for `citepilot-ai`:** look for per-request durations and Gemini `429 Rate limit`/`RESOURCE_EXHAUSTED` errors.

| Symptom | Likely Cause | Remediation |
|---|---|---|
| All requests slow, logs show long Gemini calls | Gemini latency / quota downgrade | Check status page; report usage; wait or raise quota |
| `429` errors in AI logs | Per-minute/token quota exceeded | Raise quota in AI Studio or reduce request concurrency |
| Slowness only on long documents | Linear token cost of 50k+ word docs | Expected (2–3 min); communicate in UI; chunking on roadmap |
| Instant failures (not slowness) | Crash or misconfig | [Runbook 4](#4-restart-a-crashed-service) |

**Step 3 — There is no fallback provider in the MVP** (ADR-008): Gemini is the sole LLM. Do not "switch to Claude" — if Gemini is degraded, audits fail with a retry prompt; communicate via the status/announcement channel.

---

## 8. Handle Crossref API Outage

**When to use:** Crossref API errors/unreachable, preventing reference validation.

**Estimated time:** 10–30 minutes · **Risk level:** Medium (affects validation panels, not matching)

### Procedure

**Step 1 — Confirm the outage:**

```bash
curl -s -o /dev/null -w "%{http_code}" "https://api.crossref.org/works?query=test&rows=1&mailto=api@citepilot.com"
# Expected: 200. 503/timeout = outage confirmed
curl -s "https://status.crossref.org/api/v2/summary.json"
```

**Step 2 — Verify graceful degradation:** the AI service already marks validation panels as "Crossref unavailable" (`external_validations.status = 'unavailable'`, `14-ai-nlp-design.md` §6.1). Confirm audits still complete by running one.

**Step 3 — Communicate:** post an update stating matching works but validation is temporarily unavailable; no maintenance mode exists.

**Step 4 — Monitor:** re-check every 15 minutes until `200`. Re-run validation on affected documents? Not automatic — retraction/validation panels recover on next audit; re-upload required (sessionless-by-design).

---

## 9. Respond to a Data Deletion Request

**When to use:** GDPR Article 17 erasure request via email/`privacy@citepilot.com`.

**Estimated time:** 30–60 minutes · **SLA:** 30 days from receipt; target 5 business days

### Procedure

**Step 1 — Verify identity:** confirm the request comes from the submitter's contact email.

**Step 2 — Identify data:** CitePilot stores **no document content** and holds user-related records only in the Vercel Postgres tables (`users`, `subscriptions`, `usage_logs`, `sessions`) and PayPal's records.

**Step 3 — Cancel subscription (if any):** PayPal dashboard → customers → cancel subscription.

**Step 4 — Delete from PostgreSQL:**

```sql
BEGIN;
DELETE FROM sessions WHERE user_id = '<user_id>';
DELETE FROM usage_logs WHERE user_id = '<user_id>';
DELETE FROM subscriptions WHERE user_id = '<user_id>';
DELETE FROM users WHERE id = '<user_id>';
COMMIT;
```

**Step 5 — External services:** PayPal — delete/anonymise the customer record (retain invoices per financial law, anonymised).

**Step 6 — Verify:** `SELECT COUNT(*) FROM users WHERE email = '<email>';` → `0`.

**Step 7 — Confirm to the user** (email) listing what was removed and what was retained (anonymised payment records, 7 years, per tax law). Update the deletion tracker.

---

## 10. Verify CORS Allowlist After Adding a Domain

**When to use:** After any change to the frontend origin (new domain, preview environment, staging URL).

**Steps:**

1. Open `citepilot-gateway/src/server.ts` — the CORS `origin` allowlist.
2. Add/remove the origin(s). The known set: `https://citepilot.com`, `https://www.citepilot.com`, Vercel preview domains (`https://citepilot-web-git-*.vercel.app`), `http://localhost:3000` (dev).
3. Deploy the gateway ([Runbook 6](#6-redeploy-after-environment-variable-changes)).
4. Verify from a browser on the new origin that an audit request reaches the AI service without CORS errors.

---

*Internal document — do not distribute externally. Update `Last Updated` on substantive changes.*