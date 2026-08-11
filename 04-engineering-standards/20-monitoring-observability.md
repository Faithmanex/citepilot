# 20 — Monitoring & Observability

> **Document ID**: CITE-ENG-020
> **Version**: 1.1.0
> **Last Updated**: 2026-08-11
> **Owner**: Platform Engineering
> **Status**: Approved (current state) / Roadmap (tooling)

---

## 1. Current State (MVP)

The MVP ships with **platform-native observability only** — no Datadog, Sentry, PagerDuty, or status page:

| Capability | Mechanism | Where |
|---|---|---|
| Structured logs | Structured JSON to stdout for all services; platform log viewers | Vercel dashboard; Railway service logs |
| Health checks | `GET /health` (liveness), `GET /health/deep` (DB connectivity → `503` on failure) | AI service (`citepilot-ai`) |
| Restart/deploy notifications | Discord integration on Railway/Vercel deployments and service restarts | `#deployments` |
| Uptime | Manual / on-demand checks | On-call engineer (`06-operations/25-runbooks.md`) |
| Error tracking | Log inspection (Gemini `429`/`RESOURCE_EXHAUSTED`, unhandled exceptions, crash traces) | Railway logs |
| Secret scanning | `trufflehog` in CI against every commit | GitHub Actions (`19-testing-strategy.md` §8) |

Do not scale observability tooling ahead of need: the MVP is synchronous and sessionless (ADR-011), which removes whole classes of monitoring surface (queues, workers, sessions). Each new tool must justify itself at MVP scale.

---

## 2. Roadmap (post-launch)

| Item | Priority | Objective |
|---|---|---|
| Uptime monitor on `GET /health` (e.g. Uptime Robot) | P1 | Outage detection before user reports; anchors incident response (`06-operations/26-incident-response.md`) |
| Error tracking (Sentry-style) for web + gateway + AI | P1 | Catch unhandled exceptions tagged by release |
| Latency aggregation by document size vs the §8 targets | P1 | Quantify the 5–15 s / 2–3 min benchmarks promised in `14-ai-nlp-design.md` §8 |
| Gemini usage + cost dashboard (tokens per audit) | P2 | Cost control; validate the cost profile in `15-infrastructure-deployment.md` §8 |
| On-call alerting with escalation | P2 | 24/7 coverage once traffic justifies it |
| Public status page | P3 | Customer transparency for SEV 1/2 |
| SLO definitions (availability, audit-success rate, p95 latency) | P3 | Formal targets once baseline data exists |

---

## 3. Known Baselines (targets for future tooling)

| Metric | Target | Source |
|---|---|---|
| Audit success rate | ≥ 99 % (remaining failures learner-initiated) | `26-incident-response.md` classification |
| Short-doc latency | 5–15 s | `14-ai-nlp-design.md` §8 |
| 5–20k-word latency | 15–45 s | `14-ai-nlp-design.md` §8 |
| Thesis-length latency | 2–3 min | `14-ai-nlp-design.md` §8 |
| Web p95 TTFB | Vercel edge baseline (public pages are static exports) | `11-technology-stack.md` |

---

## 4. Alert Escalation (MVP)

With no PagerDuty, escalation is manual per `06-operations/26-incident-response.md`:

1. **Detect** — Discord notification, health-check failure, or user report.
2. **Triangulate** — Railway logs + `/health` + `/health/deep`.
3. **Fix** — run the matching runbook in `06-operations/25-runbooks.md` (Gemini outage → Runbook 7, Crossref → Runbook 8, platform → Runbook 2/4/6).
4. **Learn** — SEV 1/2 incidents get a post-mortem within 48 h (incident-response §4).

---

*Internal document. Monitoring tooling is added against this roadmap, not ahead of it (ADR-011).*