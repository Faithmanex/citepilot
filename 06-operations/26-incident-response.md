# Incident Response Plan

**CitePilot — AI-Powered Citation Consistency Checker**

**Last Updated:** 2026-08-11

> **Revision:** Supersedes the July 2026 version (AWS/PagerDuty/Datadog procedures). Alerting today is platform-native: Railway/Vercel deployment+restart notifications via the Discord integration, manual health checks, and user reports. PagerDuty, Datadog, Sentry, and a status page are roadmap items (`04-engineering-standards/20-monitoring-observability.md`).

---

## 1. Incident Classification Framework

| Severity | Definition | Examples | Response SLA |
|---|---|---|---|
| **SEV 1 (Critical)** | Core service completely down; data exposure suspected. | AI service down (audits fail for everyone), payment flow broken, suspected breach. | 15 mins (24/7 if reported) |
| **SEV 2 (High)** | Major features disabled or degraded for many users. | Gemini quota exhausted, Crossref outage affecting validation, exports failing. | 30 mins |
| **SEV 3 (Medium)** | Non-critical degradation with workarounds. | Style panel bug, slow audits on long docs, minor UI issue. | 4 hours (business hours) |
| **SEV 4 (Low)** | Cosmetic/minor issues. | Typos, layout glitches, copy errors. | Next business day |

---

## 2. On-Call Incident Response Checklist

For SEV 1/SEV 2, follow this sequence:

```
[ALERT / USER REPORT / DISCORD NOTIFICATION]
         │
         ▼
 1. Acknowledge (reply in #incidents or direct message)
         │
         ▼
 2. Appoint Incident Commander (IC)
         │
         ▼
 3. Open a thread / incident channel
         │
         ▼
 4. Diagnose, apply workarounds or rollbacks (06-operations/25-runbooks.md)
         │
         ▼
 5. Communicate status (internal channel; external only if users are affected)
         │
         ▼
 6. Resolve, monitor 30 min, schedule post-mortem (if SEV 1/2)
```

---

## 3. Communication Templates

### 3.1 Outage message (SEV 1)
> **Title**: Audits temporarily unavailable
> **Message**: We are investigating reports that document audits are failing. Uploads/analyses may be interrupted. Engineering is diagnosing the cause and will post updates here. Affected systems: AI analysis, citation validation.

### 3.2 Resolution update
> **Title**: Audits restored
> **Message**: The issue affecting document audits has been resolved. Analysis is back to normal. If a document failed mid-audit, please re-upload — audits are not stored server-side.

---

## 4. Post-Mortem Process

Every SEV 1/SEV 2 requires a **blameless post-mortem within 48 hours** of resolution:

1. **Summary** — what happened, user impact, resolution.
2. **Timeline** — detection, response, mitigation, resolution (from Railway/Vercel logs).
3. **Root cause** — Five-Whys.
4. **Action items** — preventive measures with owners and due dates (tracked in GitHub issues).
5. **Lessons learned** — what worked, what didn't, where runbooks/alerts failed.
6. **Update runbooks** — `06-operations/25-runbooks.md` gains/fixes the relevant procedure.

---

## 5. Known Single Points of Failure & Owners

| Failure | Detected via | Runbook | Owner |
|---|---|---|---|
| AI service down/restarting | Railway Discord notification, `/health` | Runbook 4 | Engineering |
| Gemini outage/quota | Railway logs (`429`), Google status page | Runbook 7 | Engineering |
| Crossref outage | Validation panels show unavailable; status.crossref.org | Runbook 8 | Engineering |
| Vercel/Postgres incident | Vercel status/Dashboard, `/health/deep` | Runbook 3 | Engineering |
| CORS/domain issue | Browser console; E2E check | Runbook 10 | Engineering |

*Internal document — do not distribute externally.*