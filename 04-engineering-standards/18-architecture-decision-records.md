# 18 — Architecture Decision Records

**Document ID:** CITE-ENG-018
**Version:** 1.1.0
**Last Updated:** 2026-08-11
**Status:** Approved
**Owner:** Engineering Lead
**Audience:** All Engineers, Architects, Tech Leads

> **Revision note (v1.1.0):** This registry was rewritten to match the shipped system. Four records from v1.0 are **removed** because the technologies were never shipped (OpenAI GPT-4o, queue-based processing, AWS, Stripe, NextAuth, Datadog) and four superseding decisions now take their place (Gemini, synchronous MVP, Vercel+Railway, PayPal). ADR numbering was re-sequenced so every cross-reference in `10-`, `11-`, `12-`, `13-`, `14-`, `15-system/tech/` docs resolves (ADR-006 polyrepo, ADR-008 Gemini, ADR-009 hosting, ADR-010 PayPal, ADR-011 synchronous MVP).

---

## 1. Purpose

This document is the canonical registry of Architecture Decision Records (ADRs) for CitePilot. Each ADR captures a significant technical decision, the context that led to it, the alternatives evaluated, and the expected consequences. ADRs are immutable once accepted — if a decision is reversed, a new ADR supersedes the original rather than editing it.

## 2. ADR Format

| Field | Description |
|---|---|
| **ID** | Sequential identifier (ADR-NNN) |
| **Title** | Short, descriptive title of the decision |
| **Status** | `Accepted` → `Superseded by ADR-NNN` |
| **Date** | Date the decision was accepted |
| **Deciders** | People who made or approved the decision |
| **Context** | The problem, constraints, and forces at play |
| **Decision** | The chosen approach, stated clearly |
| **Alternatives Considered** | Other options evaluated with reasons for rejection |
| **Consequences** | Positive, negative, and neutral outcomes |

---

## ADR-001: Use FastAPI for the AI Processing Service

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-05-12 |
| **Deciders** | CTO, AI Lead, Backend Lead |

### Context

The AI processing service handles document parsing, LLM-powered citation extraction, reference matching, and external API validation (Crossref). It must:

- Integrate natively with Python ML/NLP libraries (spaCy, sentence-transformers, tiktoken).
- Call the Gemini API and handle streaming responses efficiently.
- Parse `.docx` and `.pdf` files using `python-docx` and `pdfplumber` — both Python-only libraries.
- Serve a REST API consumed by the web frontend (via the Node.js gateway).
- Handle concurrency with async I/O for external API calls.
- Provide auto-generated OpenAPI documentation for the API contract.

### Decision

Use **FastAPI** (with Uvicorn ASGI server) as the web framework for the AI processing service.

### Alternatives Considered

| Alternative | Reason for Rejection |
|---|---|
| **Flask** | Synchronous by default. Adding async support (via Quart) loses Flask's ecosystem advantage. No native OpenAPI generation. |
| **Django REST Framework** | Heavyweight ORM and admin panel unnecessary for an API-only service. Slower startup, more memory. |
| **Express.js (Node)** | Would require bridging to Python for all ML/NLP libraries, adding latency and complexity. |
| **gRPC (Python)** | Stronger typing but harder to debug; REST+JSON fits the team's workflow. |

### Consequences

**Positive:** native Python ecosystem; built-in OpenAPI spec; async-first `asyncio` for Crossref lookups; Pydantic v2 validation; DI simplifies testing.
**Negative:** two language runtimes (Python + Node/TypeScript); Python GIL limits CPU-bound parallelism (service is I/O-bound in practice).
**Neutral:** FastAPI proven at scale; risk low.

---

## ADR-002: Use Next.js (App Router) for the Frontend

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-05-10 |
| **Deciders** | CTO, Frontend Lead |

### Context

The frontend must deliver: a marketing site with strong SEO (landing, pricing, terms, privacy); the analysis dashboard (upload → results → export); fast initial loads; WCAG 2.1 AA where feasible. The team has strong TypeScript/React expertise. **Note:** the MVP is sessionless — there is no login flow in v1 (see ADR-011).

### Decision

Use **Next.js 16.2** with the App Router and TypeScript. Build-time static export for public pages; dashboard code split per route.

### Alternatives Considered

| Alternative | Reason for Rejection |
|---|---|
| **Vite + React SPA** | No SSR/SSG — poor SEO for marketing pages. |
| **Remix** | Smaller ecosystem and unfamiliarity. |
| **Nuxt.js (Vue)** | Team expertise is React-focused. |
| **Astro + React Islands** | Great for content sites, but the interactive dashboard is the primary surface. |

### Consequences

**Positive:** SEO-friendly static pages; React ecosystem; Next 16 removes the old `next lint` (CI uses `typecheck` + tests instead).
**Negative:** SSR/ISR concepts add cognitive load; bundle size must be managed.
**Neutral:** Vercel-native deployment.

---

## ADR-003: Use PostgreSQL 16 (Vercel Postgres) with Drizzle ORM

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-05-08 |
| **Deciders** | CTO, Backend Lead |

### Context

The gateway needs a relational store for paywall flags, subscription mirrors, and (roadmap) user features. The system is sessionless; there are no document blobs to store.

### Decision

Use **PostgreSQL 16** hosted on **Vercel Postgres**, accessed via **Drizzle ORM** in the Node gateway. Schema SQL lives in `supabase/migrations/` (12 files) — the heritage of the earlier Supabase iteration — and is applied to Vercel Postgres (see ADR-007).

### Alternatives Considered

| Alternative | Reason for Rejection |
|---|---|
| **SQLite** | No managed hosting, weak concurrency story. |
| **Prisma** | Heavier runtime and codegen vs Drizzle's SQL-first approach. |
| **MongoDB** | No relational integrity benefit for subscriptions/usage data. |

### Consequences

**Positive:** managed availability/backups; SQL-level control; Drizzle is type-safe and light.
**Negative:** schema drift between `supabase/migrations` and production must be manually managed (documented in `06-operations/25-runbooks.md` Runbook 3).

---

## ADR-004: Use Crossref as the Primary Reference Validation Source

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-05-25 |
| **Deciders** | AI Lead, Backend Lead |

### Context

References must be validated against an external registry to detect hallucinations and retractions.

### Decision

Use the **Crossref REST API** (works lookup by DOI or title+author) with **DOI.org resolution** as the validation sources. Retraction status is read from Crossref `is-retracted-by` metadata. The `external_validations.source` CHECK column keeps `openalex` and `pubmed` available for a future roadmap (not shipped).

### Alternatives Considered

| Alternative | Reason for Rejection |
|---|---|
| **OpenAlex / PubMed as primary** | Crossref covers journals + DOIs with retraction metadata out of the box; the others add scope without MVP benefit. |
| **Retraction Watch database** | Requires licensing/keys; Crossref metadata suffices for MVP. |

### Consequences

**Positive:** one primary API to monitor; DOI-first validation is precise; graceful degradation on outage (Runbook 8).
**Negative:** crossref-only can miss non-DOI works (websites, theses) — those fall through to DOI.org and are marked reasonable when unresolved.

---

## ADR-005: Enforce 36-Hour Document Retention Policy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-05-22 |
| **Deciders** | CTO, Legal |

### Context

Documents are privacy-sensitive; the product is sessionless; no user-owned storage should persist manuscripts.

### Decision

Enforce a **36-hour retention ceiling** (`documents.expires_at = NOW() + INTERVAL '36 hours'`). In practice documents live in AI-service memory only during the audit; the `expires_at` column + scheduled cleanup hard-delete afterwards. No object storage exists.

### Alternatives Considered

| Alternative | Reason for Rejection |
|---|---|
| **S3 + lifecycle rules** | Adds infrastructure for data that must not persist (ADR-009/011). |
| **Indefinite storage behind login** | Conflicts with the sessionless MVP and privacy stance. |

### Consequences

**Positive:** privacy story is simple and defensible; GDPR erasure is trivial (Runbook 9 — nothing to delete).
**Negative:** users cannot revisit an audit after 36 h — re-upload required.

---

## ADR-006: Adopt Polyrepo Architecture

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-05-08 |
| **Deciders** | CTO, Engineering Lead |

### Decision

Three independently deployable repositories: `citepilot-web`, `citepilot-gateway`, `citepilot-ai`. Shared types: `@citepilot/shared-types` (web ↔ gateway), `citepilot-contracts` (gateway ↔ AI).

### Context

Frontend (TypeScript/Next) and AI (Python/FastAPI) have different toolchains, runtimes, and cadences; deployment is per-service (Vercel vs Railway, ADR-009); a monorepo would couple CI and deploys.

### Alternatives Considered

| Alternative | Reason for Rejection |
|---|---|
| **Monorepo (turborepo/pnpm workspaces)** | Couples deploy cadences and CI blast radius across runtimes. |

### Consequences

**Positive:** independent deploys; clear ownership.
**Negative:** cross-repo contract drift requires shared types packages and contract tests.

---

## ADR-007: Vercel Postgres over Supabase

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-20 |
| **Deciders** | Engineering Lead |

### Context

Early iterations used Supabase (hence the `supabase/migrations/` path). At production the team standardised on Vercel's managed Postgres to co-locate with the Vercel frontend and reduce provider surface.

### Decision

Use **Vercel Postgres** (PostgreSQL 16) in production; keep running the existing `supabase/migrations/*.sql` in Vercel's query editor (or via Drizzle migrations against `DATABASE_URL`).

### Alternatives Considered

| Alternative | Reason for Rejection |
|---|---|
| **Supabase hosted** | Extra provider; auth/real-time features unused in the sessionless MVP. |
| **Neon / PlanetScale** | No co-location advantage with Vercel at MVP scale. |

### Consequences

**Positive:** one provider for web + DB; Vercel dashboard backups.
**Negative:** `supabase/migrations` naming is historical; future migrations should move to Drizzle-style files (tracked in Runbook 3).

---

## ADR-008: Google Gemini 2.5 Flash as the Sole LLM Provider

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-02 |
| **Deciders** | CTO, AI Lead |

### Context

Citation extraction, matching, hallucination adjudication, and explanation generation need an LLM. Earlier designs assumed OpenAI GPT-4o with a Claude fallback (the old ADR-004).

### Decision

Use **Google Gemini 2.5 Flash** as the only LLM provider. There is **no fallback provider** in the MVP: on Gemini failure the audit fails openly with a retry prompt (Runbook 7). Key: `GOOGLE_API_KEY` (Railway env var).

### Alternatives Considered

| Alternative | Reason for Rejection |
|---|---|
| **OpenAI GPT-4o (+/Claude fallback)** | Higher cost per audit; no meaningful accuracy advantage for citation-evaluation tasks; two providers double key management and latency tail risk. |
| **Open-source local models** | Lacking tooling accuracy for structured citation extraction at MVP effort budget. |

### Consequences

**Positive:** single integration; predictable cost; strong structured-output behaviour for citation JSON.
**Negative:** single point of failure (mitigated by clear runbook + retry UX); vendor lock-in at the prompt level.

---

## ADR-009: Vercel + Railway Hosting (supersedes AWS design)

| Field | Value |
|---|---|
| **Status** | Accepted (supersedes the AWS/ECS design) |
| **Date** | 2026-06-18 |
| **Deciders** | CTO, Engineering Lead |

### Context

The original architecture assumed AWS (ECS/Fargate, RDS, ElastiCache, S3, CloudFront, WAF, Route 53, Terraform) — weeks of infrastructure work for zero MVP benefit.

### Decision

Run production on **Vercel** (Next.js web + Postgres) and **Railway** (Node gateway + FastAPI AI service). Zero self-managed infrastructure; deploys are `npx vercel --prod` (from the monorepo root; Vercel Root Directory = `citepilot-web/`) and Railway dashboard/`railway up`. TLS, scaling, logging are platform-managed.

### Alternatives Considered

| Alternative | Reason for Rejection |
|---|---|
| **AWS (original design)** | Order-of-magnitude more operational work; no MVP-scale benefit (ADR-011). |
| **Fly.io / Render** | Railway already proven with Railpack builds for the Python service. |
| **Hetzner + self-managed** | Violates the zero-ops principle at this scale. |

### Consequences

**Positive:** deploys in minutes; auto-scaling; managed TLS; platform SLAs inherited.
**Negative:** provider capabilities bound the architecture (no custom WAF, no blue/green in Railway); future migration needs an ADR.

---

## ADR-010: PayPal Subscriptions for Billing (supersedes Stripe design)

| Field | Value |
|---|---|
| **Status** | Accepted (supersedes the Stripe design) |
| **Date** | 2026-06-25 |
| **Deciders** | CTO, Product |

### Context

The MVP monetises via a Professional subscription ($12.99/mo; plan `P-00697875B1151583ANJV3VOY`). The earlier design assumed Stripe (Checkout, Customer Portal, webhooks).

### Decision

Use **PayPal Subscriptions** via the client-side PayPal JS SDK in `citepilot-web`; the gateway exposes paywall feature flags (`PAYWALL_ENABLED`, `SHOW_PAYWALL`) rather than billing APIs. The database `subscriptions` table (migration 010) still types `stripe_*` columns — a PayPal-typed migration is pending (noted in `13-database-schema.md`).

### Alternatives Considered

| Alternative | Reason for Rejection |
|---|---|
| **Stripe Checkout + Customer Portal + webhooks** | Richer API but far more integration work than the MVP's single-plan, client-side flow needs. |
| **Paddle / LemonSqueezy** | Additional merchant onboarding; PayPal already available. |

### Consequences

**Positive:** fastest path to revenue; no backend billing service in MVP.
**Negative:** billing lifecycle UX lives in PayPal's dashboard; Stripe-typed columns linger until migration.

---

## ADR-011: Synchronous MVP Processing (supersedes queue/Redis design)

| Field | Value |
|---|---|
| **Status** | Accepted (supersedes the BullMQ/Redis design) |
| **Date** | 2026-06-20 |
| **Deciders** | Engineering Lead, AI Lead |

### Context

The original architecture ran audits through BullMQ + Redis (async, `202 Accepted`, polling, worker fleet). The product is sessionless; documents are ephemeral; latency targets are 5–15 s (short) to 2–3 min (thesis) — acceptable for a synchronous request.

### Decision

Process audits **synchronously** in a single pass: `POST /api/v1/analyse` returns the full `AuditResponse` in one response. No Redis, no queues, no workers (ADR-009). A websocket variant `/ws/analyse` is defined for a future streaming UX but not shipped.

### Alternatives Considered

| Alternative | Reason for Rejection |
|---|---|
| **BullMQ + Redis (original design)** | Adds queue, worker fleet, and Redis to operate for MVP traffic; makes the sessionless promise harder (job state must persist somewhere); revisit when real-time progress or long-running batch features ship. |
| **Polling + job table** | Same persistence problems without the queue's benefits. |

### Consequences

**Positive:** smallest operatable stack; latency within user tolerance; no job-state durability concerns.
**Negative:** very long documents tie up a request; no progress events in MVP; upgrade path (queue) exists behind this ADR.

---

## ADR Register

| ADR | Title | Status | Date |
|---|---|---|---|
| ADR-001 | FastAPI for AI Service | Accepted | 2026-05-12 |
| ADR-002 | Next.js App Router Frontend | Accepted | 2026-05-10 |
| ADR-003 | PostgreSQL 16 / Vercel Postgres / Drizzle | Accepted | 2026-05-08 |
| ADR-004 | Crossref Primary Validation Source | Accepted | 2026-05-25 |
| ADR-005 | 36-Hour Document Retention | Accepted | 2026-05-22 |
| ADR-006 | Polyrepo Architecture | Accepted | 2026-05-08 |
| ADR-007 | Vercel Postgres over Supabase | Accepted | 2026-06-20 |
| ADR-008 | Gemini 2.5 Flash Sole LLM Provider | Accepted | 2026-06-02 |
| ADR-009 | Vercel + Railway Hosting | Accepted (supersedes AWS design) | 2026-06-18 |
| ADR-010 | PayPal Subscriptions | Accepted (supersedes Stripe design) | 2026-06-25 |
| ADR-011 | Synchronous MVP | Accepted (supersedes queue design) | 2026-06-20 |

**Removed from registration (never shipped):** OpenAI GPT-4o (old ADR-004), queue-based processing (old ADR-005), AWS hosting (old ADR-007), Stripe (old ADR-008), NextAuth (old ADR-011), Datadog monitoring (old ADR-012 — monitoring remains roadmap-only per `04-engineering-standards/20-monitoring-observability.md`).