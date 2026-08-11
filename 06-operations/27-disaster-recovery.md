# 27 — Disaster Recovery Plan

> **Document ID**: CP-OPS-027
> **Version**: 1.1.0
> **Last Updated**: 2026-08-11
> **Owner**: Platform Engineering
> **Classification**: Internal — Restricted
> **Review Cadence**: Quarterly

---

## 1. Purpose & Scope

> **Revision note:** Supersedes the July 2026 AWS DR design (RDS Multi-AZ, ElastiCache, S3 CRR, cross-region ECS, Route 53 failover — **none of which exist**). CitePilot operates on **Vercel** (web + Postgres) and **Railway** (gateway + AI) with managed backups. This plan reflects the platforms' inherent redundancy and our recovery procedures within them.

This plan defines recovery objectives, backup strategy, and recovery procedures for all production systems: Next.js frontend (Vercel), Express gateway + FastAPI AI service (Railway), PostgreSQL (Vercel Postgres), and third-party integrations (Gemini, Crossref, PayPal).

---

## 2. Recovery Objectives

### 2.1 RTO / RPO Matrix

| System Component | RPO | RTO | Notes |
|---|---|---|---|
| Vercel Postgres | Platform-managed (≤ 24 h backups; manual BEFORE migrations) | ≤ 1–2 hours (restore from backup) | User/subscription metadata only — **no document content** |
| Web (Vercel) | 0 (stateless, Git-deployed) | Minutes (rollback/redeploy) | Auto-restored by Vercel after incidents |
| Gateway + AI (Railway) | 0 (stateless) | Minutes (platform restart) | Platform auto-restarts containers |
| Uploaded documents | N/A — never stored; held in AI-service memory during audit only (36 h ceiling) | N/A | Re-upload after any interruption |
| Gemini / Crossref / PayPal | N/A (external) | Graceful degradation (runbooks 7/8) | Mock/pause features, never static pages |

### 2.2 Availability Notes

- Vercel/Railway provide platform SLAs; CitePilot inherits them. Verify current guarantees in each provider's SLA.
- No capacity commitments: at MVP scale the platforms' default autoscaling suffices (Railway deploys scale automatically; Vercel functions scale per request).

---

## 3. Backup Strategy

### 3.1 Database (Vercel Postgres)

| Item | Value |
|---|---|
| Automatic backups | Vercel Dashboard — database backups (daily, platform-managed) |
| Manual backups | Take one before every migration or risky change (Vercel dashboard → Backups → Create backup) |
| Retention | Per Vercel plan defaults |
| Restore | Vercel dashboard → Backups → Restore → creates a **new instance**; then repoint `DATABASE_URL` on the gateway (Runbook 3, incl. mandatory redeploy) |

### 3.2 Application Configuration & Secrets

| Item | Backup location | Method |
|---|---|---|
| Env vars (Vercel) | Vercel project settings | Dashboard; export list of var *names* to the repo README/team notes |
| Env vars (Railway) | Railway service settings | Dashboard; same treatment |
| Code + migration SQL | GitHub (`supabase/migrations/`) | Git history |
| Migration state | `drizzle` migration metadata in DB | Backed up with the DB |

### 3.3 Backup Verification

| Check | Frequency | Method |
|---|---|---|
| Restore drill | Quarterly | Restore a Vercel Postgres backup to a scratch instance, run schema validation queries, confirm `SELECT`s work (launch checklist item I-06) |
| Env-var completeness | Quarterly | Rebuild gateway+AI from a fresh Railway environment using the documented variable list |

---

## 4. Disaster Recovery Scenarios

### 4.1 S1 — Single Service Failure (web, gateway, or AI down)

**Symptoms:** `/health` fails; Railway Discord notification; error rates up in logs.

**Automatic:** platform restarts containers/redeploys functions; Vercel serves the last good deployment.

**Manual:** redeploy/restart per Runbook 4; if caused by a bad release, rollback per Runbook 2.

**Estimated recovery:** minutes (automatic) / 15 min (manual).

### 4.2 S2 — Complete Platform Failure

**Vercel(outage)** — recover web by pushing a static fallback? At MVP scale: rely on Vercel's status page; web downtime is inherited. Announce via team channel.

**Railway outage** — gateway+AI down for all users:
1. Confirm on Railway status page.
2. Communicate (audits unavailable; re-upload after).
3. When Railway recovers: service auto-restarts — verify `/health`, `/health/deep`, one test audit.
4. **There is no cross-provider failover in the MVP.** Documented alternative (re-deploying from git to another provider) is a roadmap/ADR item, not an operating expectation.

### 4.3 S3 — Database Failure / Data Corruption

**Symptoms:** `/health/deep` returns `503`; gateway errors on DB writes.

**Procedure:**
1. Check Vercel dashboard + status page (DB instance down vs region incident).
2. If instance-specific: Vercel usually auto-recovers; if corrupt/needs rebuild, restore the most recent backup to a new instance (Runbook 3 rollback).
3. Repoint `DATABASE_URL` (gateway) and redeploy.
4. Validate: `/health/deep` `200`; subscription/paywall flags behave (they fall back to env vars if DB is unavailable — verify `SHOW_PAYWALL`/`PAYWALL_ENABLED`).

**Impact limits:** no audit data is lost (documents are never persisted); only user/subscription metadata is at risk.

### 4.4 S4 — Security Incident / Credential Compromise

Trigger: confirmed or suspected unauthorized access (e.g., GitHub token leak, API key in a public repo, Vercel/Railway account compromise).

**Procedure:**
1. Contain: revoke the exposed token/key immediately (GitHub → Security, AI Studio, provider dashboards).
2. Rotate all secrets per Runbook 5 (Gemini key, PayPal credentials, `DATABASE_URL` if exposed).
3. Redeploy after each change (Runbook 6).
4. Review access lists (Vercel/Railway team members, GitHub collaborators).
5. If user data may be affected: notify `privacy@citepilot.com` / regulator per GDPR — within **72 hours** of becoming aware.

---

## 5. Degraded Modes

| Mode | Trigger | Retained | Disabled |
|---|---|---|---|
| Crossref unavailable | Crossref outage | Matching, export, everything else | Validation panels (marked unavailable) |
| Gemini quota/outage | Gemini degraded | Landing/pricing pages | Audits (fail with retry prompt) |
| DB read fail | Postgres backup/restore | Audits (non-DB path) | Paywall/subscription mirrors (env fallback) |
| Vercel outage | Platform incident | — (inherited downtime) | Everything web |

---

## 6. Communication Plan

| Severity | Internal | External |
|---|---|---|
| S1 Service failure | Team channel | Only if user-visible outage > 15 min — status announcement |
| S2 Platform failure | Team channel + status announcement | Status announcement (re-upload guidance) |
| S3 Data failure | Team channel + engineering leadership | Only if user metadata affected (GDPR considerations) |
| S4 Security | Leadership + legal | Per GDPR/legal approval only |

No status page/customer notification tooling exists yet (roadmap); use the team channel and, if applicable, a message on the landing/dashboard via the `SHOW_PAYWALL`-style env mechanism or a rapid web deploy.

---

## 7. Roles & Responsibilities

| Role | Responsibilities |
|---|---|
| On-call / first responder | Detect via Discord + health checks; execute runbooks; escalate |
| Incident Commander | Coordinate, communicate, decide rollback; post-mortem owner |
| Engineering Lead | Owns runbooks + this plan; leads quarterly restore drills |
| DPO/Legal | GDPR breach notification + breach register |

---

## 8. Document Maintenance

| Activity | Frequency | Owner |
|---|---|---|
| Review/update this plan | Quarterly | Engineering Lead |
| Restore drill (Vercel Postgres backup) | Quarterly, first before launch | Engineering Lead |
| Update after every production incident | ≤ 1 week post-resolution | Incident Commander |
| Review provider SLAs/status pages | Semi-annually | Engineering Lead |

---

## 9. Key Platforms Quick Reference

| Platform | Role | Console | Recovery entry point |
|---|---|---|---|
| Vercel | Web + Postgres | vercel.com/dashboard | Deployments (rollback), Postgres → Backups (restore) |
| Railway | Gateway + AI | railway.app | Service → Deployments (redeploy/rollback), Variables |
| Google AI Studio | Gemini key | aistudio.google.com | Quotas, key management |
| PayPal | Subscriptions | paypal.com (merchant) | Subscription management, plan `P-00697875B1151583ANJV3VOY` |
| GitHub | Code + CI (`trufflehog` secret scan) | github.com | Workflow runs, secret scanning alerts |

*This document is classified Internal — Restricted. Distribution limited to engineering and leadership.*