# 16 — Security Architecture

> **Status**: Approved · **Owner**: Engineering — Security & Privacy · **Last Updated**: 2026-08-11

---

## 1. Overview

CitePilot processes sensitive academic documents — unpublished research, personal information, and intellectual property — but stores none of them. The MVP is **sessionless and accountless**: there are no user accounts, no credentials, and no authentication layer. This document defines the security model of that design: a small, well-understood attack surface backed by managed-platform security (Vercel, Railway, Vercel Postgres, PayPal) rather than self-managed infrastructure. There is no AWS account, no VPC, no IAM, no WAF, and no self-managed encryption tooling.

### Security Principles

| Principle | Application |
|---|---|
| **Minimal Attack Surface** | No accounts, no sessions, no document storage. Uploaded bytes live only in process memory and are wiped ≤ 36 h. |
| **Data Minimisation** | Only citation metadata (public facts) is persisted; raw document text is never stored or logged. |
| **Platform-Managed Security** | Vercel, Railway and Vercel Postgres own infrastructure security: patching, TLS termination, DDoS protection, disk encryption. We rely on their SLAs and certifications (SOC 2 / ISO 27001) rather than operating our own equivalents. |
| **Zero Trust Between Tiers** | Gateway ↔ AI service calls require a shared secret header; webhooks are signature-verified; no implicit trust between components. |
| **Least Privilege** | Single-purpose database roles; AI service uses its own API key with no access to production credentials; PayPal integration uses minimal scopes. |
| **Encryption Everywhere** | TLS 1.2+ in transit (platform-managed); Vercel Postgres and platform disks encrypted at rest (platform-managed, AES-256). |
| **Fail Closed** | On validation failure (bad file, bad signature, missing secret), requests are rejected — never partially processed. |

---

## 2. Authentication & Identity

- **MVP: no authentication.** The product is anonymous; analysis results are keyed by unguessable random tokens (`analysis_token`, 32+ bytes of CSPRNG entropy) so users can re-open their own results without an account.
- **No session layer:** no session cookies, no CSRF tokens, no OAuth flows, no NextAuth dependency.
- **Plans are device-anonymous:** entitlement is derived from a client-held plan reference looked up server-side via `GET /api/v1/subscription` using the token.
- **Institutional tier (future):** if accounts are introduced, they will use OIDC (Google/Microsoft), SPA PKCE flow, and scoped JWT sessions — see `18-architecture-decision-records.md` notes on the future accounts decision. This is a roadmap item, not present in the MVP.

### Threat note

The absence of credentials removes password-cracking, credential-stuffing, session-hijacking, and CSRF from the threat model entirely. The remaining identity risk is abuse of anonymous analysis (spam) — mitigated by rate limiting (§4.5).

---

## 3. Data Protection

### 3.1 Data Inventory

| Data class | Held? | Where | Retention |
|---|---|---|---|
| Uploaded document bytes | Process memory only | Gateway/AI service RAM | Wiped at request end; hard cap 36 h |
| Extracted citation text | Process memory only | AI service RAM | Wiped with request |
| Citation metadata + report | Yes | Vercel Postgres | Indefinite (public bibliographic facts) |
| `analysis_token` | Yes | Vercel Postgres | Indefinite |
| Plan/subscription state | Yes | Vercel Postgres | Indefinite |
| PayPal order/webhook records | Yes | Vercel Postgres | Indefinite (billing audit) |
| Payment card data | Never | PayPal only | N/A |
| User identity / email | Yes (from PayPal webhook, receipt only) | Vercel Postgres | Indefinite |

### 3.2 In-Memory Handling of Documents

- Files are streamed: the gateway never buffers the full multi-MB upload in a single heap buffer; it proxies the stream to the AI service which parses incrementally and holds only the parsed text structures.
- Parsed text and AI payloads are discarded via explicit teardown at the end of each request handler.
- Fail-safe: the AI service enforces a hard TTL — any leftover request artifacts are purged within 36 hours of creation regardless of request outcome (crashed workers are discarded by Railway restarts; there is no disk spooling).
- **No spill-to-disk:** none of the services writes uploaded content to disk or object storage.

### 3.3 Encryption

| Layer | Mechanism | Managed by |
|---|---|---|
| In transit (client ↔ Vercel, Vercel ↔ Railway) | TLS 1.2+ | Vercel / Railway edge |
| In transit (Railway services ↔ Gemini, Crossref, doi.org, OpenAlex, PubMed, PayPal) | TLS 1.2+ | Railway + provider APIs |
| At rest (Vercel Postgres) | Platform-managed AES-256 disk encryption | Vercel |
| At rest (AI/gateway container filesystem) | Railway-managed volume encryption (none used for secrets; secrets are env vars) | Railway |

No application-level crypto keys are required in the MVP: there is nothing server-side worth key-wrapping, so KMS-style key management does not exist.

---

## 4. Application Security Controls

### 4.1 Input Validation (Uploads)

Validated at **three layers** (client → gateway → AI service):

| Check | Rule |
|---|---|
| Extension allow-list | `.docx`, `.pdf`, `.txt`, `.rtf`, `.bib` only |
| Size | ≤ 50 MB |
| Content sniffing | Magic bytes must match the declared extension (e.g. `PK` for `.docx`/`.rtf`? — `.docx` is a ZIP (`PK\x03\x04`); `.pdf` starts with `%PDF-`) |
| Parsing sandbox | AI service parses in-process with strict library versions; parse errors abort the request |
| Payload limits | AI response JSON validated against schema; citation text capped per field |

### 4.2 Secrets Management

- **No Secrets Manager service.** Secrets are platform env vars: `GEMINI_API_KEY`, `PAYPAL_CLIENT_ID`/`CLIENT_SECRET`/`WEBHOOK_ID`, `DATABASE_URL`, inter-service secret header — set via Vercel and Railway dashboards only.
- Rotation is manual + scheduled (quarterly) via dashboard re-set and redeploy; `LEARNING.md` documents the "set env var → redeploy immediately" workflow.
- Git-secrets guard: `trufflehog` runs in CI (see `17-engineering-guidelines.md` §CI) to prevent accidental commits; `.env` files are git-ignored.

### 4.3 API Security

- **Rate limiting:** in-memory, per-IP token bucket on the gateway (e.g. 10 req/min for `/analyse`, stricter for webhook endpoints).
- **Analysis tokens:** 32+ bytes CSPRNG, URL-safe, single-purpose; token comparison is constant-time.
- **PayPal webhooks:** TLS + PayPal signature verification using the webhook ID; idempotency enforced on `paypal_order_id`; webhook endpoint is read-mostly and parses only expected event types.
- **CORS allowlist:** `citepilot-gateway/src/server.ts` — explicit origins (production domain + localhost dev). No wildcard.
- **Headers:** HSTS, X-Content-Type-Options, frame-ancestors CSP set by the Vercel configuration.

### 4.4 Logging & Monitoring

- Structured JSON logs, correlation ID per request; **document contents and citation text are never logged.**
- Sentry (error tracking) and Prometheus/Grafana (metrics) via Railway integrations; alerting on error-rate and latency SLOs (see `20-monitoring-observability.md`).
- No log retention of upload payloads; logs capped (Sentry default retention).

### 4.5 Abuse Mitigation

| Vector | Control |
|---|---|
| Anonymous request flooding | Per-IP rate limits; Vercel edge throttling |
| AI cost abuse (token spam) | Rate limits + per-request payload caps (page-count, citation-count ceilings) + min-delay on concurrent analyses |
| Webhook forgery | Signature verification + idempotency |
| Token brute-force on analysis | 128-bit+ token space; constant-time compare; rate limit on reads |

---

## 5. Third-Party & Supply Chain

| Third party | Data shared | Security posture |
|---|---|---|
| **Gemini API** | Extracted citation text, instruction prompts (no document text beyond citation excerpts; zero-retention data treatment is requested) | Google Cloud; API inputs not used for training |
| **Crossref / doi.org / OpenAlex / PubMed** | Bibliographic queries (DOI, title, author) — public data only | read-only public APIs |
| **PayPal** | Billing details (checkout handled on PayPal domains; only order ID + email returned) | PCI DSS compliant processor; no card data reaches us |
| **Vercel / Railway** | Hosting, env secrets, logs | SOC 2 certified; platform-managed patching |

- Supply-chain hygiene: lockfiles committed in all three repos; `npm audit` / `pip-audit` run in CI; Dependabot-style update PRs reviewed before merge (see `17-engineering-guidelines.md`).

---

## 6. GDPR & Data Governance Alignment

- **Legal basis & flows:** full mapping in `22-privacy-policy.md`; key points: no account data is collected (Art. 6(1)(b) contract basis only for the analysis service itself); document content transitively requires care because we minimise content to citation excerpts before any AI call.
- **Data residency:** Vercel Postgres and Railway regions are EU/U.S. platform defaults; region selection is documented in `15-infrastructure-deployment.md`; EU-U.S. data flows rely on provider DPF/Standard Contractual Clauses. (CitePilot does **not** run an AWS eu-west-1 cluster.)
- **Rights handling (future/current):** since no account exists, "delete my data" requests are satisfied by deleting the `analysis_token`-keyed rows; contact path: dpo@citepilot.com.
- **DPIA:** the anonymous, in-memory design is the minimisation that the DPIA relies on; any future accounts or storage feature triggers a re-DPIA (see `18-architecture-decision-records.md`, future-considerations).

---

## 7. Incident Response & Testing

- **Incident response:** `26-incident-response.md` (severity matrix, comms, postmortems). Security incidents follow the same runbook.
- **Security testing cadence:**
  - CI: secret scanning (trufflehog), dependency audits, lint + typecheck.
  - Quarterly: dependency upgrade review and manual penetration pass on the public surface (upload validation, token enumeration, webhook replay).
  - Annual: third-party pen test once revenue justifies; DPA/sub-processor list review with each contract renewal.
- **Known limitations (honesty note):** no automated DAST/SAST pipeline configured for the MVP beyond CI audits; no bug-bounty program; no dedicated security engineer — security ownership sits with the platform team using managed controls. These are documented gaps with owners and target quarters in `04-engineering-standards/19-testing-strategy.md`.

---

## 8. Security Responsibilities Matrix

| Concern | Owner |
|---|---|
| Infrastructure (patching, TLS, DDoS, disk encryption) | Vercel / Railway (contractual) |
| Application code security (validation, tokens, rate limits) | Platform team |
| Secrets (env vars, rotation) | Platform team |
| AI/data minimisation | AI service owner |
| Privacy/GDPR documentation | Legal/Engineering (docs as source of truth) |
| Penetration testing (annual) | External vendor (procured) |