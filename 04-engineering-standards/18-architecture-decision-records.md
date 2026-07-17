# 18 — Architecture Decision Records

**Document ID:** CITE-ENG-018
**Version:** 1.0
**Last Updated:** 2026-07-14
**Status:** Approved
**Owner:** Engineering Lead
**Audience:** All Engineers, Architects, Tech Leads

---

## 1. Purpose

This document is the canonical registry of Architecture Decision Records (ADRs) for CitePilot. Each ADR captures a significant technical decision, the context that led to it, the alternatives evaluated, and the expected consequences. ADRs are immutable once accepted — if a decision is reversed, a new ADR supersedes the original rather than editing it.

## 2. ADR Format

Every ADR follows this structure:

| Field | Description |
|---|---|
| **ID** | Sequential identifier (ADR-NNN) |
| **Title** | Short, descriptive title of the decision |
| **Status** | `Proposed` → `Accepted` → `Deprecated` / `Superseded by ADR-NNN` |
| **Date** | Date the decision was accepted |
| **Deciders** | People who made or approved the decision |
| **Context** | The problem, constraints, and forces at play |
| **Decision** | The chosen approach, stated clearly |
| **Alternatives Considered** | Other options evaluated with reasons for rejection |
| **Consequences** | Positive, negative, and neutral outcomes of the decision |

---

## ADR-001: Use FastAPI for the AI Processing Service

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-05-12 |
| **Deciders** | CTO, AI Lead, Backend Lead |

### Context

CitePilot's AI processing service handles document parsing, LLM-powered citation extraction, reference matching, and external API validation (Crossref, OpenAlex, PubMed). This service must:

- Integrate natively with Python ML/NLP libraries (spaCy, sentence-transformers, tiktoken).
- Call the OpenAI API and handle streaming responses efficiently.
- Parse `.docx` and `.pdf` files using `python-docx` and `pdfplumber` — both Python-only libraries.
- Serve an internal REST API consumed by the Node.js API gateway.
- Handle high concurrency with async I/O for external API calls.
- Provide auto-generated OpenAPI documentation for the internal API contract.

### Decision

Use **FastAPI** (with Uvicorn ASGI server) as the web framework for the AI processing service.

### Alternatives Considered

| Alternative | Reason for Rejection |
|---|---|
| **Flask** | Synchronous by default. Adding async support (via Quart) loses Flask's ecosystem advantage. No native OpenAPI generation. |
| **Django REST Framework** | Heavyweight ORM and admin panel unnecessary for an internal API-only service. Slower startup, more memory. |
| **Express.js (Node)** | Would require bridging to Python for all ML/NLP libraries via subprocess or gRPC, adding latency and operational complexity. |
| **gRPC (Python)** | Stronger typing but harder to debug, no browser-friendly docs, and the gateway team is more productive with REST+JSON. |

### Consequences

**Positive:**
- Native Python ecosystem access for all document parsing and ML libraries.
- Built-in OpenAPI spec generation eliminates contract drift between services.
- Async-first design with `asyncio` handles concurrent Crossref/OpenAlex/PubMed lookups efficiently.
- Pydantic v2 integration provides request/response validation with zero boilerplate.
- Dependency injection system simplifies testing and configuration management.

**Negative:**
- Two language runtimes in the stack (Python + Node.js) increases operational complexity.
- Python's GIL limits CPU-bound parallelism — mitigated by offloading CPU work to process pools and keeping the service I/O-bound.
- Team must maintain proficiency in both TypeScript and Python.

**Neutral:**
- FastAPI's maturity is proven at scale (used by Microsoft, Netflix, Uber) so framework risk is low.

---

## ADR-002: Use Next.js 15 for the Frontend

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-05-10 |
| **Deciders** | CTO, Frontend Lead |

### Context

CitePilot's frontend must deliver:

- A marketing site with strong SEO (pricing, landing pages, blog).
- An authenticated dashboard for document upload, results viewing, and account management.
- Real-time progress updates during AI analysis (WebSocket or SSE).
- Fast initial loads for the document results page (potentially large datasets).
- Accessibility compliance (WCAG 2.1 AA).

The team has strong TypeScript/React expertise.

### Decision

Use **Next.js 15** with the App Router, React Server Components, and TypeScript as the frontend framework.

### Alternatives Considered

| Alternative | Reason for Rejection |
|---|---|
| **Vite + React SPA** | No SSR/SSG — poor SEO for marketing pages. Would require a separate static site for marketing. |
| **Remix** | Strong contender. Rejected due to smaller ecosystem, fewer deployment adapters for AWS, and team unfamiliarity. |
| **Nuxt.js (Vue)** | Team expertise is React-focused. Switching frameworks for no architectural advantage is unjustified. |
| **Astro + React Islands** | Excellent for content-heavy sites but the interactive dashboard is the primary surface, making a full React framework more appropriate. |

### Consequences

**Positive:**
- Server Components reduce client-side JavaScript for the results page, improving LCP.
- Built-in SSG for marketing pages delivers near-instant loads and excellent SEO.
- Middleware enables edge-level auth checks and redirects.
- API routes act as a lightweight BFF (Backend for Frontend) proxy, keeping API keys server-side.
- Streaming SSR enables progressive rendering of large result sets.
- Vercel-backed, widely adopted, strong community and hiring pool.

**Negative:**
- App Router is newer than Pages Router — some third-party libraries have incomplete support.
- Server Component mental model has a learning curve (client vs. server boundaries).
- Vendor influence (Vercel) on the framework's direction — mitigated by deploying on AWS (not Vercel).

---

## ADR-003: Use PostgreSQL as the Primary Database

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-05-08 |
| **Deciders** | CTO, Backend Lead, DBA |

### Context

CitePilot needs a primary database for:

- User accounts and authentication data.
- Subscription/billing records (linked to Stripe).
- Document metadata (not document content — stored in S3).
- Citation analysis results (structured JSON per document).
- Usage tracking and quota enforcement.
- Audit logs for compliance.

Data is relational (users → documents → results), requires ACID transactions (billing), and benefits from complex queries (analytics, reporting).

### Decision

Use **PostgreSQL 16** (managed via AWS RDS) as the primary database.

### Alternatives Considered

| Alternative | Reason for Rejection |
|---|---|
| **MySQL 8** | Viable, but PostgreSQL's JSONB support is superior for storing semi-structured citation results. PostgreSQL also has better support for UUIDv7, partial indexes, and CTEs. |
| **MongoDB** | Document model is appealing for citation results, but the core data is relational. Two databases (Mongo + Postgres for billing) adds unnecessary complexity. |
| **DynamoDB** | Excellent for simple key-value at scale, but CitePilot needs joins, aggregations, and ad-hoc queries for analytics. DynamoDB's query model is too restrictive. |
| **CockroachDB** | Distributed SQL is unnecessary at CitePilot's current scale. Adds latency and cost with no benefit until >10M users. |

### Consequences

**Positive:**
- JSONB columns store citation results as structured JSON with full indexing and query support, avoiding a separate document store.
- ACID transactions ensure billing and quota enforcement are consistent.
- Rich ecosystem: Drizzle ORM (TypeScript), SQLAlchemy (Python), pgvector (future embedding search).
- AWS RDS provides automated backups, point-in-time recovery, Multi-AZ failover, and read replicas.
- Team familiarity — everyone knows PostgreSQL.

**Negative:**
- Vertical scaling has limits — if CitePilot reaches >100M citation results, sharding or a read replica strategy will be needed.
- JSONB queries on deeply nested citation results can be slower than a native document store — mitigated by GIN indexes on commonly queried paths.

---

## ADR-004: Use OpenAI GPT-4o as the Primary AI Model

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-05-15 |
| **Deciders** | CTO, AI Lead |

### Context

CitePilot's core value proposition is AI-powered citation analysis. The LLM must:

1. Extract in-text citations from natural language text, distinguishing them from false positives (e.g., "the year 2020" is not a citation).
2. Parse reference list entries into structured components (authors, year, title, journal, DOI).
3. Match citations to references with fuzzy matching and contextual understanding.
4. Detect citation style and validate formatting against the detected style's rules.
5. Generate human-readable explanations and corrections for each issue found.
6. Identify potentially hallucinated references by cross-checking against real databases.

The model must be accurate (>95% precision on citation extraction), fast (<5s per 1000 words), and cost-effective at scale.

### Decision

Use **OpenAI GPT-4o** as the primary LLM, with **Anthropic Claude 3.5 Sonnet** as a fallback for availability and as a secondary evaluator for hallucination detection.

### Alternatives Considered

| Alternative | Reason for Rejection |
|---|---|
| **GPT-4o-mini** | 30% cheaper but measurably worse at citation style nuances (OSCOLA footnote parsing, Vancouver numbered references). Used for non-critical tasks like generating user-facing explanations. |
| **Claude 3.5 Sonnet (primary)** | Comparable quality. Rejected as primary due to lower rate limits on the Anthropic API and less mature function calling/structured output support. Kept as fallback. |
| **Llama 3.1 70B (self-hosted)** | Eliminates per-token cost but requires GPU infrastructure (A100/H100). Not cost-effective until >50k documents/month. Revisit at scale. |
| **Fine-tuned GPT-4o-mini** | Promising for citation extraction specifically, but fine-tuning requires a large labeled dataset we don't have yet. Planned for Phase 3. |
| **Rule-based only (no LLM)** | This is what Reciteworks does. Produces high false positive rates (flagging "2020" as a citation) and cannot generate explanations. Defeats our core differentiator. |

### Consequences

**Positive:**
- GPT-4o achieves >97% precision on citation extraction in our benchmark of 500 test documents across 9 styles.
- Structured output mode (JSON schema enforcement) ensures predictable response formats.
- Function calling enables the model to trigger Crossref/PubMed lookups within the reasoning chain.
- Broad training data includes academic writing conventions across all target citation styles.

**Negative:**
- Per-token cost: ~$2.50/1M input tokens, ~$10/1M output tokens. At 5000 tokens average per document, cost is ~$0.06/document. Must be factored into pricing.
- Vendor lock-in to OpenAI's API. Mitigated by the abstraction layer (`llm/client.py`) and Claude fallback.
- Latency: 2-5s per LLM call. Mitigated by parallelizing extraction and matching steps where possible.
- Model updates may change behavior. Mitigated by pinning model versions and running regression tests on golden datasets before adopting new versions.

---

## ADR-005: Use Queue-Based Async Processing for AI Analysis

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-05-18 |
| **Deciders** | CTO, Backend Lead, AI Lead |

### Context

A full citation check involves:

1. Document upload and parsing (1-3s).
2. Citation extraction via LLM (3-8s).
3. Reference list parsing via LLM (2-5s).
4. Citation-to-reference matching (1-3s).
5. External validation via Crossref/OpenAlex/PubMed (2-10s, parallelized).
6. Retraction check (1-2s).
7. Hallucination detection (2-5s).
8. Result compilation and explanation generation (2-4s).

Total: 15-40 seconds for a typical 10,000-word document. This exceeds acceptable HTTP response times and would tie up server threads/connections.

### Decision

Use **BullMQ** (Redis-backed job queue) for asynchronous processing of citation analysis jobs. The API gateway enqueues the job and immediately returns a job ID. The client polls for status or subscribes via Server-Sent Events.

### Alternatives Considered

| Alternative | Reason for Rejection |
|---|---|
| **Synchronous HTTP (long request)** | 30-40s requests cause timeouts, connection drops, and poor UX. Load balancers and CDNs typically timeout at 30s. |
| **WebSocket for full pipeline** | Adds connection management complexity. SSE is simpler for unidirectional server→client updates. |
| **AWS SQS + Lambda** | Lambda's cold start latency (1-5s) and 15-minute timeout are acceptable, but BullMQ gives us better job observability, retry logic, and progress tracking without AWS-specific coupling. |
| **Celery (Python)** | Mature but heavy. BullMQ is lighter, has better dashboard tooling (Bull Board), and the gateway team already uses Node.js/Redis. |
| **Temporal** | Overkill for our workflow complexity. Excellent for long-running sagas, but our pipeline is a simple sequential/parallel DAG that BullMQ handles well. |

### Consequences

**Positive:**
- User gets immediate feedback (job accepted) and progressive updates (SSE/polling).
- Workers can be scaled independently from the API gateway.
- Failed jobs are automatically retried with exponential backoff (max 3 retries).
- Job progress is tracked at each pipeline step, enabling granular progress bars in the UI.
- Dead letter queue captures permanently failed jobs for debugging.
- Bull Board dashboard provides operational visibility into queue health.

**Negative:**
- Added infrastructure complexity (Redis must be highly available).
- Eventual consistency — the client must handle the "still processing" state gracefully.
- Cross-language boundary: BullMQ is Node.js-native; the Python AI service consumes jobs via a bridging layer (BullMQ Python client or Redis-native BRPOP protocol).

---

## ADR-006: Adopt Polyrepo Architecture

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-05-08 |
| **Deciders** | CTO, Engineering Lead |

### Context

CitePilot consists of three distinct services with different languages, runtimes, and deployment cadences:

| Service | Language | Deployment Frequency | Team |
|---|---|---|---|
| Frontend (`citepilot-web`) | TypeScript/Next.js | 2-3x/week | Frontend team |
| API Gateway (`citepilot-gateway`) | TypeScript/Node.js | 1-2x/week | Backend team |
| AI Service (`citepilot-ai`) | Python/FastAPI | 3-5x/week (prompt tuning, model updates) | AI team |

### Decision

Use a **polyrepo** architecture with three independent Git repositories, each with its own CI/CD pipeline.

### Alternatives Considered

| Alternative | Reason for Rejection |
|---|---|
| **Monorepo (Turborepo/Nx)** | Turborepo and Nx excel for all-JavaScript monorepos but have limited Python support. The Python service would be a second-class citizen with a separate build system (uv/pyproject.toml) bolted on. CI complexity increases as all pipelines share a single repo. |
| **Monorepo (Bazel)** | Bazel handles multi-language monorepos well but has a steep learning curve and significant setup/maintenance overhead. Not justified for a 3-service system with a small team. |
| **Two repos (TS monorepo + Python)** | Viable. Rejected because the frontend and gateway have different deployment targets (CloudFront+Lambda@Edge vs. ECS) and different dependency graphs. Coupling them increases CI time for no benefit. |

### Consequences

**Positive:**
- Clear ownership boundaries — each repo has a distinct CODEOWNERS file and team.
- Independent deployment — shipping a prompt improvement doesn't touch the frontend pipeline.
- Smaller, faster CI — each pipeline only runs relevant tests.
- Simpler onboarding — a new frontend developer only needs the `citepilot-web` repo.

**Negative:**
- Cross-repo changes (e.g., adding a new field to the API contract) require coordinated PRs across repos.
- Shared types must be published as versioned packages (`@citepilot/shared-types`, `citepilot-contracts`), adding release management overhead.
- Integration testing across services requires a docker-compose setup or staging environment — cannot be tested in a single CI run.

**Mitigations:**
- Contract changes follow a versioned schema with backward compatibility rules (additive only for minor versions).
- A weekly cross-repo integration test runs in a shared staging environment.
- `@citepilot/shared-types` is auto-published on merge to main with semantic versioning.

---

## ADR-007: Use AWS as the Cloud Provider

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-05-06 |
| **Deciders** | CTO, DevOps Lead |

### Context

CitePilot needs cloud infrastructure for compute, storage, database, CDN, DNS, and container orchestration. Key requirements:

- Managed PostgreSQL with automated backups and failover.
- Container orchestration for the API gateway and AI service.
- Object storage for uploaded documents (encrypted, lifecycle-managed).
- CDN for the Next.js frontend.
- Managed Redis for caching and job queues.
- Cost predictability at current scale (hundreds of users) with ability to scale to thousands.
- GDPR-compatible data residency options.

### Decision

Use **Amazon Web Services (AWS)** with the following managed services:

| Need | AWS Service |
|---|---|
| Compute | ECS Fargate (serverless containers) |
| Database | RDS PostgreSQL 16 (Multi-AZ) |
| Cache/Queue | ElastiCache Redis 7 |
| Object Storage | S3 (with lifecycle policies) |
| CDN | CloudFront |
| DNS | Route 53 |
| Secrets | Secrets Manager |
| Container Registry | ECR |
| Logging | CloudWatch Logs → Datadog |
| Monitoring | CloudWatch Metrics → Datadog |

### Alternatives Considered

| Alternative | Reason for Rejection |
|---|---|
| **Google Cloud Platform** | Comparable services. Rejected because the team has deeper AWS experience, and GCP's managed Redis (Memorystore) has fewer configuration options than ElastiCache. |
| **Vercel + PlanetScale + Upstash** | Excellent DX for Next.js frontend. However, the Python AI service cannot run on Vercel. Using Vercel for frontend + AWS for backend creates split-brain infrastructure management. |
| **DigitalOcean App Platform** | Simpler and cheaper for small scale, but lacks the depth of managed services (no equivalent to ECS Fargate, limited IAM, no native secrets manager). |
| **Self-hosted (bare metal)** | Lowest per-unit cost at scale but massive operational overhead. Not viable with a small team. |

### Consequences

**Positive:**
- Comprehensive managed services reduce operational burden (backups, patching, scaling handled by AWS).
- ECS Fargate eliminates server management — we define containers and resource limits, AWS handles the rest.
- S3 lifecycle policies automate the 36-hour document deletion requirement.
- CloudFront edge caching + S3 origin provides sub-100ms static asset delivery globally.
- IAM policies enable fine-grained security controls per service.

**Negative:**
- AWS costs can escalate unpredictably with usage. Mitigated by cost alerts, reserved instances for RDS, and Fargate Spot for non-critical workloads.
- AWS-specific IaC (CDK/CloudFormation) creates vendor lock-in. Mitigated by using Terraform for infrastructure definitions.
- Learning curve for IAM policies, VPC networking, and security groups.

---

## ADR-008: Use Stripe for Payment Processing

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-05-20 |
| **Deciders** | CTO, Backend Lead, Finance |

### Context

CitePilot has four pricing tiers (Free, Student $4.99/mo, Professional $12.99/mo, Institutional custom). The payment system must:

- Handle recurring subscriptions with monthly billing.
- Support credit/debit cards and potentially PayPal.
- Manage plan upgrades, downgrades, and cancellations.
- Handle prorated billing on plan changes.
- Provide invoicing for institutional customers.
- Be PCI DSS compliant without CitePilot handling card data directly.
- Support webhook-driven event processing for real-time subscription status updates.
- Integrate with the Node.js API gateway.

### Decision

Use **Stripe** (Checkout, Billing, Customer Portal, and Webhooks) for all payment processing.

### Alternatives Considered

| Alternative | Reason for Rejection |
|---|---|
| **Paddle** | Handles global tax/VAT as a Merchant of Record — appealing. Rejected because Paddle's subscription management is less flexible than Stripe Billing for custom institutional plans, and their API documentation is less mature. |
| **Lemon Squeezy** | Similar MoR benefits to Paddle. Rejected due to limited enterprise features and younger platform with fewer integrations. |
| **PayPal Subscriptions** | Widely recognized but poor developer experience, weaker webhook reliability, and no native equivalent to Stripe's Customer Portal. |
| **Self-built (via payment gateway)** | PCI compliance burden alone makes this unjustifiable for a startup. |

### Consequences

**Positive:**
- Stripe Checkout handles the entire payment flow (card input, 3DS, error handling) — we never touch card data.
- Stripe Billing manages recurring charges, retries, dunning, and proration automatically.
- Customer Portal allows users to manage their own subscription (change plan, update card, cancel) without us building a UI.
- Webhooks provide real-time subscription lifecycle events (`customer.subscription.created`, `.updated`, `.deleted`).
- Excellent Node.js SDK with TypeScript types.
- Stripe Tax can be added later for automated tax calculation.

**Negative:**
- 2.9% + $0.30 per transaction. On a $4.99/month Student plan, Stripe takes ~$0.44 (8.8%). Significant at the low end.
- Not a Merchant of Record — CitePilot is responsible for VAT/sales tax compliance in applicable jurisdictions. Must integrate Stripe Tax or a third-party tax service before launching in the EU.
- Stripe's Customer Portal has limited customization — may not match CitePilot's brand perfectly.

---

## ADR-009: Enforce 36-Hour Document Retention Policy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-05-22 |
| **Deciders** | CTO, Legal, Privacy Officer |

### Context

CitePilot processes academic documents that may contain:

- Unpublished research (intellectual property).
- Student work (academic integrity concerns).
- Personal data embedded in documents (author names, institutional affiliations).
- Proprietary content from institutional customers.

Users need confidence that their documents are not stored indefinitely. Competitors handle this differently: Reciteworks deletes after 36 hours; Grammarly retains for up to 90 days.

Legal requirements:
- GDPR Article 5(1)(e): data minimization and storage limitation.
- University data processing agreements typically require prompt deletion.
- FERPA compliance (for US educational institutions) requires limiting access to student records.

### Decision

Enforce a **36-hour document retention policy**:

1. Uploaded document files (in S3) are deleted exactly 36 hours after upload via S3 lifecycle rules.
2. Extracted text stored temporarily in Redis during processing is evicted after 2 hours (TTL).
3. Analysis results (structured JSON) are retained for 30 days to allow users to access their results, then permanently deleted.
4. Document metadata (filename, word count, upload timestamp) is retained for billing/audit purposes but contains no document content.
5. Users can delete their documents and results immediately at any time via the dashboard.
6. S3 lifecycle rules are the enforcement mechanism — deletion is automatic and does not depend on application code.

### Alternatives Considered

| Alternative | Reason for Rejection |
|---|---|
| **24-hour retention** | Too short. Users uploading in the evening may not check results until the next day. |
| **7-day retention** | Unnecessarily long. Increases storage costs and regulatory exposure. |
| **User-configurable retention** | Adds complexity and shifts GDPR compliance burden to the user. Simpler to enforce a single short policy. |
| **No document storage (process and delete immediately)** | Cannot support the results page or "re-check" feature. Users would lose all results the moment they close the tab. |

### Consequences

**Positive:**
- Strong privacy posture — marketable as a trust differentiator ("your documents are never stored for more than 36 hours").
- Matches Reciteworks' policy, so users switching to CitePilot have no privacy regression.
- Reduces S3 storage costs (documents are ephemeral, not accumulating).
- Simplifies GDPR data subject access requests (less data to search).
- S3 lifecycle rules are reliable and auditable — deletion doesn't depend on application uptime.

**Negative:**
- Users cannot revisit results after 30 days — must re-upload and re-analyze.
- No "document history" feature possible.
- Analysis results must be self-contained (include all relevant context) since the source document will be gone.

---

## ADR-010: Use Crossref as the Primary Reference Validation Source

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-05-25 |
| **Deciders** | AI Lead, Backend Lead |

### Context

A key differentiator for CitePilot is verifying that cited references are real publications (hallucination detection). This requires looking up references against external bibliographic databases. Options include:

- **Crossref:** 150M+ metadata records covering journal articles, books, conference papers. DOI-based. Free API with polite rate limits (50 req/s with mailto).
- **OpenAlex:** 250M+ works, open metadata, faster API, but less precise DOI-to-metadata matching.
- **PubMed:** 36M+ biomedical citations. Excellent for medical/life sciences, irrelevant for humanities/social sciences.
- **Google Scholar:** Broadest coverage but no official API — scraping violates ToS.
- **Semantic Scholar:** Good coverage but rate-limited API (100 req/5min without API key).

### Decision

Use **Crossref** as the primary reference validation source. Use **OpenAlex** as a secondary source for records not found in Crossref. Use **PubMed** as a supplementary source specifically for biomedical documents (detected by citation style or user selection).

### Alternatives Considered

| Alternative | Reason for Rejection |
|---|---|
| **OpenAlex as primary** | Broader coverage but metadata quality is lower for older publications. Crossref is the authoritative DOI registry. |
| **PubMed as primary** | Excellent for biomedical, useless for humanities, engineering, law. Too narrow for a general-purpose tool. |
| **Google Scholar scraping** | Violates ToS. Unreliable. No structured API. Legal risk. |
| **Semantic Scholar as primary** | Rate limits too restrictive for production use without enterprise agreement. |

### Consequences

**Positive:**
- Crossref is the authoritative DOI registration agency — if a DOI exists, Crossref has it.
- Polite pool access (50 req/s) is sufficient for CitePilot's throughput at launch.
- API returns structured metadata (title, authors, year, journal, DOI, type) that maps directly to citation validation needs.
- Free, no API key required (just a `mailto` header for polite pool).
- OpenAlex as secondary catches records that have no DOI (conference papers, some books).
- PubMed as supplementary provides MeSH terms and abstracts for biomedical references.

**Negative:**
- Three external APIs increase failure surface. Mitigated by independent circuit breakers and graceful degradation (validation is best-effort, not blocking).
- Crossref polite pool rate limits (50 req/s) could be hit during burst processing of large documents with 200+ references. Mitigated by request batching with 500ms delays and 24-hour response caching in Redis.
- Coverage gaps: books without DOIs, legal cases (OSCOLA), government reports. These will show as "unable to verify" rather than "hallucinated" — important distinction in the UI.

---

## ADR-011: Use NextAuth.js for Authentication

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-05-20 |
| **Deciders** | CTO, Frontend Lead, Security Lead |

### Context

CitePilot requires user authentication for:

- Protecting user documents and results.
- Enforcing subscription tier quotas.
- Tracking usage for billing.
- Supporting institutional SSO (future).

Target users are academics and students who commonly use Google (via university Google Workspace) or Microsoft (via university Office 365) accounts. Email/password must also be supported for users without institutional SSO.

### Decision

Use **NextAuth.js (Auth.js v5)** with Google OAuth, Microsoft OAuth, and email/password (credentials) providers. JWT-based sessions with short-lived access tokens (15 minutes) and database-backed refresh tokens (7 days).

### Alternatives Considered

| Alternative | Reason for Rejection |
|---|---|
| **Clerk** | Excellent DX but expensive at scale ($0.02/MAU after 10k users). Adds vendor dependency for a critical path. |
| **Auth0** | Enterprise-grade but complex configuration and expensive. Overkill for current scale. |
| **Supabase Auth** | Tightly coupled to Supabase's ecosystem. We use raw PostgreSQL on RDS, not Supabase. |
| **Custom JWT implementation** | Security risk. Rolling custom auth is a well-documented antipattern. |
| **Firebase Auth** | Google-only OAuth provider management. Poor integration with non-Google infrastructure. |

### Consequences

**Positive:**
- First-party Next.js integration — works seamlessly with App Router, middleware, and server components.
- Google + Microsoft OAuth covers 90%+ of academic users (university-issued accounts).
- JWT sessions are stateless and can be verified by the API gateway without calling the frontend.
- Open-source, no per-user pricing, no vendor lock-in.
- Extensible — adding SAML/OIDC for institutional SSO is a documented configuration change.

**Negative:**
- Credentials provider (email/password) requires implementing password hashing and reset flows manually (NextAuth provides the hooks but not the UI).
- JWT token size can grow with custom claims. Mitigated by keeping claims minimal (userId, email, tier, role) and looking up additional data from the database when needed.
- Auth.js v5 is a significant rewrite — API surface is still stabilizing. Pinned to a specific version to avoid breaking changes.

---

## ADR-012: Use Datadog for Monitoring and Observability

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-01 |
| **Deciders** | CTO, DevOps Lead, Backend Lead |

### Context

CitePilot needs a unified observability platform for:

- Log aggregation from three services + AWS infrastructure.
- Application metrics (request latency, error rates, throughput).
- Business metrics (uploads/day, citations checked, conversion rate).
- AI-specific metrics (inference latency, token usage, model accuracy).
- Distributed tracing across the gateway → AI service → external APIs pipeline.
- Alerting with escalation policies.
- Dashboards for engineering, product, and business stakeholders.

### Decision

Use **Datadog** as the primary observability platform, with **Sentry** for error tracking and **CloudWatch** as the log transport layer (CloudWatch Logs → Datadog Log Forwarder).

### Alternatives Considered

| Alternative | Reason for Rejection |
|---|---|
| **Grafana Cloud (Loki + Tempo + Prometheus)** | Excellent and cheaper. Rejected because it requires more setup and maintenance for distributed tracing (Tempo) compared to Datadog's turnkey APM. Reconsider at scale when cost becomes a factor. |
| **New Relic** | Comparable features. Rejected due to less intuitive UI for log correlation and weaker Kubernetes/ECS integration compared to Datadog. |
| **AWS-native (CloudWatch + X-Ray)** | Cheapest option. Rejected because CloudWatch's querying and dashboard capabilities are significantly weaker. X-Ray's tracing instrumentation is AWS-specific and doesn't integrate well with Python's structlog. |
| **Elastic Stack (self-hosted)** | Powerful but significant operational overhead to manage Elasticsearch clusters. Not viable with a small team. |

### Consequences

**Positive:**
- Unified platform for logs, metrics, traces, and alerts — single pane of glass.
- Datadog APM provides automatic service maps and dependency graphs.
- Log-to-trace correlation enables clicking from an error log directly to the distributed trace.
- Custom metrics API supports business and AI-specific metrics without additional infrastructure.
- Pre-built AWS integration dashboards for RDS, ElastiCache, ECS, and S3.
- PagerDuty integration for alert escalation.

**Negative:**
- Datadog is expensive. Estimated cost at launch: ~$200-400/month (log ingestion + APM + infrastructure monitoring). Grows with volume.
- Vendor lock-in for dashboards and alert configurations. Mitigated by defining alerting rules as code (Terraform Datadog provider).
- Must ensure sensitive data (document content, PII) is not shipped to Datadog logs. Enforced by structlog/pino redaction processors.

---

## ADR Index

| ADR | Title | Status | Date |
|---|---|---|---|
| ADR-001 | Use FastAPI for AI Service | Accepted | 2026-05-12 |
| ADR-002 | Use Next.js 15 for Frontend | Accepted | 2026-05-10 |
| ADR-003 | PostgreSQL as Primary Database | Accepted | 2026-05-08 |
| ADR-004 | OpenAI GPT-4o as Primary AI Model | Accepted | 2026-05-15 |
| ADR-005 | Queue-Based Async Processing for AI | Accepted | 2026-05-18 |
| ADR-006 | Polyrepo Architecture | Accepted | 2026-05-08 |
| ADR-007 | AWS as Cloud Provider | Accepted | 2026-05-06 |
| ADR-008 | Stripe for Payments | Accepted | 2026-05-20 |
| ADR-009 | 36-Hour Document Retention Policy | Accepted | 2026-05-22 |
| ADR-010 | Crossref as Primary Reference Validation | Accepted | 2026-05-25 |
| ADR-011 | NextAuth.js for Authentication | Accepted | 2026-05-20 |
| ADR-012 | Datadog for Monitoring and Observability | Accepted | 2026-06-01 |

---

*New ADRs should be added sequentially. To supersede a decision, create a new ADR and update the original's status to "Superseded by ADR-NNN".*
