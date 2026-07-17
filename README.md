# CitePilot — Product & Engineering Documentation

> **AI-Powered Academic Citation Consistency Checker**

This repository contains the complete product, engineering, and operational documentation for CitePilot — an AI-powered platform that checks in-text citations against reference lists, validates sources against real academic databases, detects hallucinated and retracted citations, and provides intelligent suggestions for corrections.

CitePilot supports 9+ citation styles (APA 7, APA 6, Harvard, Vancouver, Chicago, MLA, IEEE, OSCOLA, Turabian) and targets students, academics, researchers, editors, and institutions.

---

## Documentation Index

### Phase 01 — Product Foundation

Core product definition, market analysis, and competitive positioning.

| # | Document | Description |
|---|---|---|
| 01 | [Product Requirements Document](01-product/01-product-requirements.md) | Complete PRD defining CitePilot's vision, target users, feature set across plan tiers, success metrics, and product constraints. The foundational document all other specs derive from. |
| 02 | [Competitive Analysis](01-product/02-competitive-analysis.md) | Deep analysis of Reciteworks and the broader citation tool market. Feature-by-feature comparison, pricing benchmarks, SWOT analysis, and strategic positioning for CitePilot's market entry. |
| 03 | [User Research & Personas](01-product/03-user-research-personas.md) | Six detailed user personas (undergraduate student, PhD researcher, academic editor, dissertation coach, institutional admin, journal author) with pain points, goals, workflows, and feature priorities. |
| 04 | [User Stories & Acceptance Criteria](01-product/04-user-stories.md) | Comprehensive user stories organised by epic (document upload, citation analysis, results interaction, reference validation, account management, institutional features) with testable acceptance criteria. |

### Phase 02 — Architecture & Technical Design

System architecture, data models, AI pipeline design, and integration specifications.

| # | Document | Description |
|---|---|---|
| 05 | [System Architecture](02-architecture/05-system-architecture.md) | High-level system architecture: Next.js frontend, Node.js API gateway, Python FastAPI AI layer, PostgreSQL, Redis, BullMQ, S3, and AWS infrastructure. Includes component diagrams, data flow, and deployment topology. |
| 06 | [Database Schema](02-architecture/06-database-schema.md) | Complete PostgreSQL schema design with all tables (users, documents, citations, references, matches, subscriptions, institutions), relationships, indexes, migrations strategy, and query patterns. |
| 07 | [API Specification](02-architecture/07-api-specification.md) | Full REST API specification for the Node.js gateway: all endpoints, request/response schemas, authentication, rate limiting, error codes, pagination, and webhook contracts. |
| 08 | [AI Pipeline Design](02-architecture/08-ai-pipeline-design.md) | Architecture of the AI-powered citation analysis pipeline: document parsing, LLM prompt engineering for citation extraction and matching, OpenAI/Claude integration, fallback chains, confidence scoring, and cost optimisation. |
| 09 | [External API Integration](02-architecture/09-external-api-integration.md) | Integration specifications for Crossref REST API, OpenAlex API, PubMed E-utilities, DOI.org, and Retraction Watch database. Covers rate limits, caching strategy, error handling, and data mapping. |
| 10 | [Citation Style Engine](02-architecture/10-citation-style-engine.md) | Design of the multi-style citation parsing and validation engine supporting 9+ styles. Style rule definitions, pattern libraries, AI-assisted style detection, and extensibility framework for adding new styles. |

### Phase 03 — Frontend Design

UI/UX design, component architecture, and user interface specifications.

| # | Document | Description |
|---|---|---|
| 11 | [UI/UX Design System](03-frontend/11-ui-ux-design-system.md) | Complete design system: colour palette, typography, spacing, component library (buttons, inputs, cards, modals), dark mode, accessibility standards (WCAG 2.1 AA), and brand guidelines. |
| 12 | [Frontend Architecture](03-frontend/12-frontend-architecture.md) | Next.js 15 application architecture: page structure, routing, state management, server components vs client components, API client layer, authentication flow, and performance optimisation strategy. |
| 13 | [Results Interface Design](03-frontend/13-results-interface-design.md) | Detailed specification of the citation results UI: annotated document view, colour-coded highlights, split view, filter panel, issue detail cards, AI explanation display, ignore/report interactions, and PDF export layout. |

### Phase 04 — Backend & Infrastructure

Backend service design, queue processing, security, and cloud infrastructure.

| # | Document | Description |
|---|---|---|
| 14 | [Backend Service Design](04-backend/14-backend-service-design.md) | Node.js API gateway and Python FastAPI service design: module structure, middleware pipeline, dependency injection, error handling, logging, health checks, and inter-service communication. |
| 15 | [Document Processing Pipeline](04-backend/15-document-processing-pipeline.md) | End-to-end document processing: file upload validation, .docx/.pdf parsing (python-docx, pdfplumber, Apache Tika), text extraction, structural analysis, reference list detection, and BullMQ job orchestration. |
| 16 | [Authentication & Authorisation](04-backend/16-authentication-authorisation.md) | NextAuth.js configuration: Google/Microsoft/email providers, JWT session management, role-based access control, institutional SSO (SAML 2.0), API key authentication, and security hardening. |
| 17 | [Payment & Subscription System](04-backend/17-payment-subscription-system.md) | Stripe integration design: product/price catalogue, checkout flow, subscription lifecycle (create, upgrade, downgrade, cancel), webhook handling, invoice generation, and metered billing for institutional plans. |
| 18 | [Infrastructure & Deployment](04-backend/18-infrastructure-deployment.md) | AWS infrastructure specification: VPC design, ECS Fargate service definitions, RDS configuration, ElastiCache setup, S3 bucket policies, CloudFront distribution, ACM certificates, and Terraform/IaC strategy. |

### Phase 05 — Quality Assurance

Testing strategy, performance benchmarks, and security audit plans.

| # | Document | Description |
|---|---|---|
| 19 | [Testing Strategy](05-qa/19-testing-strategy.md) | Comprehensive testing plan: unit testing (Jest, pytest), integration testing, end-to-end testing (Playwright), AI output evaluation framework, citation style test corpus, performance testing (k6), and CI test pipeline. |
| 20 | [AI Accuracy Evaluation](05-qa/20-ai-accuracy-evaluation.md) | Methodology for evaluating AI citation analysis quality: benchmark datasets per citation style, precision/recall/F1 metrics, false positive analysis, regression testing, human evaluation protocol, and accuracy targets per release. |
| 21 | [Performance Benchmarks](05-qa/21-performance-benchmarks.md) | Performance targets and testing: API response time budgets, citation analysis latency by document size, database query performance, frontend Core Web Vitals, load testing scenarios, and capacity planning. |
| 22 | [Security Audit Plan](05-qa/22-security-audit-plan.md) | Security assessment framework: OWASP Top 10 review, penetration testing scope, dependency vulnerability scanning, secrets management audit, GDPR compliance checklist, and incident response readiness. |

### Phase 06 — Operations

Monitoring, cost management, compliance, and disaster recovery.

| # | Document | Description |
|---|---|---|
| 23 | [Monitoring & Observability](06-operations/23-monitoring-observability.md) | Observability stack design: Datadog APM, Sentry error tracking, structured logging, custom metrics, SLO definitions, alert rules, PagerDuty integration, dashboards, and on-call runbooks. |
| 24 | [Cost Analysis & Optimisation](06-operations/24-cost-analysis.md) | Detailed cost modelling: AWS infrastructure costs by service, OpenAI/Claude API costs per document, external API costs (Crossref, PubMed), Stripe fees, total cost per user by plan tier, break-even analysis, and optimisation strategies. |
| 25 | [Privacy & Compliance](06-operations/25-privacy-compliance.md) | GDPR and UK GDPR compliance framework: data processing register, lawful basis for processing, data subject rights implementation, 36-hour document retention policy, DPA inventory, breach notification procedures, and DPIA. |
| 26 | [Operational Runbooks](06-operations/26-operational-runbooks.md) | Step-by-step runbooks for operational scenarios: deployment, rollback, database failover, Redis cache flush, OpenAI quota management, rate limit adjustment, incident response, and common debugging procedures. |
| 27 | [Disaster Recovery Plan](06-operations/27-disaster-recovery.md) | Complete DR plan: RTO/RPO targets per system component, backup strategy (RDS snapshots, S3 cross-region replication, Redis AOF), recovery procedures for 5 severity levels (service failure through region failure and data breach), quarterly DR testing programme, and business continuity. |

### Phase 07 — Launch

Pre-launch verification, support content, and go-live procedures.

| # | Document | Description |
|---|---|---|
| 28 | [Pre-Launch Checklist](07-launch/28-launch-checklist.md) | Comprehensive launch readiness checklist across 10 categories: Legal & Compliance, Security, Performance, Analytics & Monitoring, SEO, Accessibility, Infrastructure, Support & Operations, Marketing, and Functional Verification. Each item has priority, owner, and acceptance criteria. |
| 29 | [Support Documentation & Help Centre](07-launch/29-support-documentation.md) | Complete user-facing help centre content: Getting Started guides, Understanding Results, Citation Style reference, AI Features explanation, Reference Validation, Account Management, Institutional guide, Troubleshooting, and 18-question FAQ. Ready for publication at `/help`. |

---

## Repository Structure

```
citation-platform-docs/
├── README.md                              ← You are here
├── 01-product/
│   ├── 01-product-requirements.md
│   ├── 02-competitive-analysis.md
│   ├── 03-user-research-personas.md
│   └── 04-user-stories.md
├── 02-architecture/
│   ├── 05-system-architecture.md
│   ├── 06-database-schema.md
│   ├── 07-api-specification.md
│   ├── 08-ai-pipeline-design.md
│   ├── 09-external-api-integration.md
│   └── 10-citation-style-engine.md
├── 03-frontend/
│   ├── 11-ui-ux-design-system.md
│   ├── 12-frontend-architecture.md
│   └── 13-results-interface-design.md
├── 04-backend/
│   ├── 14-backend-service-design.md
│   ├── 15-document-processing-pipeline.md
│   ├── 16-authentication-authorisation.md
│   ├── 17-payment-subscription-system.md
│   └── 18-infrastructure-deployment.md
├── 05-qa/
│   ├── 19-testing-strategy.md
│   ├── 20-ai-accuracy-evaluation.md
│   ├── 21-performance-benchmarks.md
│   └── 22-security-audit-plan.md
├── 06-operations/
│   ├── 23-monitoring-observability.md
│   ├── 24-cost-analysis.md
│   ├── 25-privacy-compliance.md
│   ├── 26-operational-runbooks.md
│   └── 27-disaster-recovery.md
└── 07-launch/
    ├── 28-launch-checklist.md
    └── 29-support-documentation.md
```

---

## How to Use This Documentation

### For Product & Leadership
Start with the [Product Requirements Document](01-product/01-product-requirements.md) and [Competitive Analysis](01-product/02-competitive-analysis.md) for strategic context. The [User Research & Personas](01-product/03-user-research-personas.md) document informs all product decisions. Review the [Cost Analysis](06-operations/24-cost-analysis.md) for financial planning and [Pre-Launch Checklist](07-launch/28-launch-checklist.md) for launch readiness.

### For Engineers
Begin with the [System Architecture](02-architecture/05-system-architecture.md) for the big picture, then drill into relevant documents: [Database Schema](02-architecture/06-database-schema.md), [API Specification](02-architecture/07-api-specification.md), [AI Pipeline Design](02-architecture/08-ai-pipeline-design.md), and the backend/frontend architecture docs. Reference the [Operational Runbooks](06-operations/26-operational-runbooks.md) and [Disaster Recovery Plan](06-operations/27-disaster-recovery.md) for production operations.

### For Designers
The [UI/UX Design System](03-frontend/11-ui-ux-design-system.md) defines all visual and interaction standards. The [Results Interface Design](03-frontend/13-results-interface-design.md) covers the most complex user-facing screen. Cross-reference with [User Stories](01-product/04-user-stories.md) for feature requirements and acceptance criteria.

### For QA & Security
Start with the [Testing Strategy](05-qa/19-testing-strategy.md) and [AI Accuracy Evaluation](05-qa/20-ai-accuracy-evaluation.md). The [Security Audit Plan](05-qa/22-security-audit-plan.md) covers security testing scope. The [Pre-Launch Checklist](07-launch/28-launch-checklist.md) defines all items that must pass before go-live.

---

## Document Conventions

| Convention | Meaning |
|---|---|
| **CP-PROD-0XX** | Product document identifier |
| **CP-ARCH-0XX** | Architecture document identifier |
| **CP-FE-0XX** | Frontend document identifier |
| **CP-BE-0XX** | Backend document identifier |
| **CP-QA-0XX** | Quality assurance document identifier |
| **CP-OPS-0XX** | Operations document identifier |
| **CP-LAUNCH-0XX** | Launch document identifier |
| 🔴 | Hard blocker — must be resolved |
| 🟡 | Soft blocker — can proceed with risk acceptance |
| 🟢 | Recommended — not blocking |

---

## Contributing

All documentation is written in Markdown. When updating documents:

1. Update the `Last Updated` date in the document header
2. Increment the version number for significant changes
3. Add a brief changelog entry at the bottom of the document if appropriate
4. Ensure all cross-references to other documents remain valid
5. Update this README if adding new documents or changing the structure

---

*Last updated: 15 July 2026*
