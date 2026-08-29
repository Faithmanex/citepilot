# CitePilot — Documentation Repository

> **AI-Powered Academic Citation Consistency Checker**

This repository contains the complete product, design, engineering, and operational documentation for CitePilot, alongside the working codebases (`citepilot-web`, `citepilot-ai`, `supabase/migrations`).

CitePilot checks in-text citations against reference lists, validates sources against Crossref/DOI.org, detects hallucinated and retracted references, and reports style-rule and structural issues — with PDF and annotated-DOCX exports. It supports 10 citation styles (APA 7, APA 6, Harvard, Vancouver, Chicago Author-Date, Chicago Notes-Bibliography, MLA 9, IEEE, OSCOLA, Turabian).

**System at a glance:** web on **Vercel** (Next.js 16.2) · gateway + AI service on **Railway** (Node 22/Express + Python 3.12/FastAPI) · **Vercel Postgres** (PostgreSQL 16, Drizzle) · **Google Gemini 2.5 Flash** as the sole LLM · **Crossref** validation · **PayPal** subscriptions. Sessionless, synchronous MVP (see `04-engineering-standards/18-architecture-decision-records.md` ADR-008–011).

> **Note:** the working code is vendored in this monorepo (`citepilot-web/`, `citepilot-ai/`, `supabase/migrations/`) — not as git submodules. The `citepilot-gateway` referenced in older docs is not present as a separate checkout; AI calls go via `next.config.ts` rewrites to `NEXT_PUBLIC_API_URL` (Railway). See `AGENTS.md` and `LEARNING.md` for navigation rules and deployment quirks.

---

## Quick Start Guide

| Topic | Doc |
|---|---|
| System architecture | [10-system-architecture.md](03-technical-architecture/10-system-architecture.md) |
| Every tech choice with rationale | [11-technology-stack.md](03-technical-architecture/11-technology-stack.md) |
| API contract (executable) | [12-api-specification.md](03-technical-architecture/12-api-specification.md) |
| Database schema (SQL source of truth) | [13-database-schema.md](03-technical-architecture/13-database-schema.md) |
| AI/NLP pipeline | [14-ai-nlp-design.md](03-technical-architecture/14-ai-nlp-design.md) |
| Infrastructure & deployment (Vercel/Railway) | [15-infrastructure-deployment.md](03-technical-architecture/15-infrastructure-deployment.md) |
| Architecture decision records | [18-architecture-decision-records.md](04-engineering-standards/18-architecture-decision-records.md) |
| Runbooks (deploy/rollback/secrets) | [25-runbooks.md](06-operations/25-runbooks.md) |
| Disaster recovery | [27-disaster-recovery.md](06-operations/27-disaster-recovery.md) |

---

## Documentation Index

### 01 — Discovery & Strategy

| # | Document | Description |
|---|---|---|
| 01 | [Competitive Analysis](01-discovery-strategy/01-competitive-analysis.md) | Reciteworks and the citation-checker market: feature comparison, pricing benchmarks, positioning. |
| 02 | [Product Requirements Document](01-discovery-strategy/02-prd.md) | Vision, target users, feature set, success metrics, constraints. |
| 03 | [User Story Map](01-discovery-strategy/03-user-story-map.md) | Epics and user stories with acceptance criteria. |
| 04 | [GTM Strategy](01-discovery-strategy/04-gtm-strategy.md) | Go-to-market plan, channels, funnel. |
| 05 | [Business Model](01-discovery-strategy/05-business-model.md) | Pricing tiers, unit economics, cost model. |

### 02 — Design

| # | Document | Description |
|---|---|---|
| 06 | [Design System](02-design/06-design-system.md) | Brand palette, typography, components, accessibility baseline. |
| 07 | [Information Architecture](02-design/07-information-architecture.md) | Site structure, navigation, route map. |
| 08 | [Wireframes & Mockups](02-design/08-wireframes-mockups.md) | Page-level layouts and flows. |
| 09 | [UX Specification](02-design/09-ux-specification.md) | Interaction requirements, states, edge cases. |

### 03 — Technical Architecture

| # | Document | Description |
|---|---|---|
| 10 | [System Architecture](03-technical-architecture/10-system-architecture.md) | Component model, data flow, architecture decisions. |
| 11 | [Technology Stack](03-technical-architecture/11-technology-stack.md) | Every tech choice with rationale and alternatives. |
| 12 | [API Specification](03-technical-architecture/12-api-specification.md) | The live `/api/v1` contract (analyse, exports, health). |
| 13 | [Database Schema](03-technical-architecture/13-database-schema.md) | PostgreSQL design vs the `supabase/migrations` implementation. |
| 14 | [AI/NLP Design](03-technical-architecture/14-ai-nlp-design.md) | Parser → extractor → matcher → style → validation pipeline. |
| 15 | [Infrastructure & Deployment](03-technical-architecture/15-infrastructure-deployment.md) | Vercel + Railway hosting, environments, scaling, costs. |
| 16 | [Security Architecture](03-technical-architecture/16-security-architecture.md) | Threat model, data handling, secrets, upload validation. |

### 04 — Engineering Standards

| # | Document | Description |
|---|---|---|
| 17 | [Engineering Guidelines](04-engineering-standards/17-engineering-guidelines.md) | Repo structure, code style, PR process, logging, security standards. |
| 18 | [Architecture Decision Records](04-engineering-standards/18-architecture-decision-records.md) | ADR-001–011 including Gemini, Vercel+Railway, PayPal, synchronous MVP. |
| 19 | [Testing Strategy](04-engineering-standards/19-testing-strategy.md) | Vitest/pytest/Playwright, golden datasets, CI gates, security scans. |
| 20 | [Monitoring & Observability](04-engineering-standards/20-monitoring-observability.md) | Current platform-native state; Datadog/Sentry/status-page roadmap. |

### 05 — Legal & Compliance

| # | Document | Description |
|---|---|---|
| 21 | [Terms of Service](05-legal-compliance/21-terms-of-service.md) | User-facing ToS. |
| 22 | [Privacy Policy](05-legal-compliance/22-privacy-policy.md) | GDPR/UK GDPR, 36-hour document retention, data flows. |
| 23 | [Cookie Policy](05-legal-compliance/23-cookie-policy.md) | Cookies (analytics/consent). |
| 24 | [Accessibility Statement](05-legal-compliance/24-accessibility-statement.md) | WCAG stance and roadmap. |

### 06 — Operations

| # | Document | Description |
|---|---|---|
| 25 | [Operational Runbooks](06-operations/25-runbooks.md) | Deploy, rollback, migrations, secrets rotation, Gemini/Crossref outages. |
| 26 | [Incident Response](06-operations/26-incident-response.md) | Severity levels, response checklist, post-mortems. |
| 27 | [Disaster Recovery](06-operations/27-disaster-recovery.md) | RTO/RPO, backups (Vercel Postgres), platform failure recovery. |

### 07 — Launch

| # | Document | Description |
|---|---|---|
| 28 | [Launch Checklist](07-launch/28-launch-checklist.md) | Pre-launch verification across compliance, security, performance, support. |
| 29 | [Support Documentation & Help Centre](07-launch/29-support-documentation.md) | User-facing guides and FAQ. |

---

## Repository Structure

```
citepilot-docs/
├── README.md                          ← You are here
├── AGENTS.md                          ← Agent navigation + deployment rules
├── LEARNING.md                        ← Project gotchas & root causes (read first)
├── DESIGN.md
├── 01-discovery-strategy/
│   ├── 01-competitive-analysis.md
│   ├── 02-prd.md
│   ├── 03-user-story-map.md
│   ├── 04-gtm-strategy.md
│   └── 05-business-model.md
├── 02-design/
│   ├── 06-design-system.md
│   ├── 07-information-architecture.md
│   ├── 08-wireframes-mockups.md
│   └── 09-ux-specification.md
├── 03-technical-architecture/
│   ├── 10-system-architecture.md
│   ├── 11-technology-stack.md
│   ├── 12-api-specification.md
│   ├── 13-database-schema.md
│   ├── 14-ai-nlp-design.md
│   ├── 15-infrastructure-deployment.md
│   └── 16-security-architecture.md
├── 04-engineering-standards/
│   ├── 17-engineering-guidelines.md
│   ├── 18-architecture-decision-records.md
│   ├── 19-testing-strategy.md
│   └── 20-monitoring-observability.md
├── 05-legal-compliance/
│   ├── 21-terms-of-service.md
│   ├── 22-privacy-policy.md
│   ├── 23-cookie-policy.md
│   └── 24-accessibility-statement.md
├── 06-operations/
│   ├── 25-runbooks.md
│   ├── 26-incident-response.md
│   └── 27-disaster-recovery.md
├── 07-launch/
│   ├── 28-launch-checklist.md
│   └── 29-support-documentation.md
├── citepilot-web/                     # Next.js 16.2 frontend (vendored)
├── citepilot-ai/                      # Python 3.12 FastAPI AI service (vendored)
├── supabase/
│   └── migrations/                    # SQL schema (14 files) — DB source of truth
└── brand/
    └── guidelines/
```

---

## How to Use This Documentation

- **All roles:** [Competitive Analysis](01-discovery-strategy/01-competitive-analysis.md) + [PRD](01-discovery-strategy/02-prd.md) for strategic context; [Launch Checklist](07-launch/28-launch-checklist.md) for readiness.
- **Engineers:** [System Architecture](03-technical-architecture/10-system-architecture.md) → [Technology Stack](03-technical-architecture/11-technology-stack.md) → [API Spec](03-technical-architecture/12-api-specification.md) → [Database Schema](03-technical-architecture/13-database-schema.md). Operate with [Runbooks](06-operations/25-runbooks.md) and [Disaster Recovery](06-operations/27-disaster-recovery.md). Decisions: [ADR Registry](04-engineering-standards/18-architecture-decision-records.md).
- **Designers:** [Design System](02-design/06-design-system.md) → [UX Specification](02-design/09-ux-specification.md).
- **QA/Compliance:** [Testing Strategy](04-engineering-standards/19-testing-strategy.md), [Monitoring](04-engineering-standards/20-monitoring-observability.md), legal docs in `05-legal-compliance/`.

---

## Document Conventions

- All docs are Markdown with YAML-style headers (**Document ID**, **Version**, **Last Updated**, **Status**, **Owner**).
- Update `Last Updated` and increment **Version** on substantive changes.
- Cross-references use relative paths — keep them valid.
- On-disk document IDs use the schemes `CP-DS-0XX`, `CP-ARCH-0XX`, `CITE-ENG-0XX`, `CP-OPS-0XX`, `CP-LAUNCH-0XX` (stated in each file's header). Previous README versions claimed a `CP-PROD-0XX` scheme — that is obsolete.
- When code and docs disagree, **executable code wins** (API contract: `citepilot-ai/src/api/`; schema: `supabase/migrations/`).

---

## Contributing

1. Update the document header (`Last Updated`, `Version`).
2. Keep all cross-references valid.
3. Update this README when adding documents or changing structure.
4. Substantive technical changes should cite or create an ADR (`04-engineering-standards/18-architecture-decision-records.md`).

---

*Last updated: 11 August 2026*