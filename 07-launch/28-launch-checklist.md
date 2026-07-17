# 28 — Pre-Launch Checklist

> **Document ID**: CP-LAUNCH-028
> **Version**: 1.0
> **Last Updated**: 2026-07-15
> **Owner**: Product & Engineering Leadership
> **Target Launch Date**: TBD (all items must be ✅ before launch)

---

## Overview

This checklist defines every item that must be completed, verified, and signed off before CitePilot enters public availability. Items are organised by category, each with a responsible owner, acceptance criteria, and sign-off field.

**Completion Protocol**:
- Each item must be verified by the designated owner
- Items marked 🔴 are hard blockers — launch cannot proceed without them
- Items marked 🟡 are soft blockers — launch can proceed with documented risk acceptance from the CTO
- Items marked 🟢 are recommended — should be completed but will not block launch
- Sign-off requires the owner's initials and date in the Status column

---

## 1. Legal & Compliance

| # | Item | Priority | Owner | Acceptance Criteria | Status |
|---|---|---|---|---|---|
| L-01 | Terms of Service published | 🔴 | Legal | Reviewed by external counsel, published at `/terms`, covers liability limitations, user data handling, acceptable use, and AI-generated content disclaimers | ☐ |
| L-02 | Privacy Policy published | 🔴 | Legal / DPO | GDPR and UK GDPR compliant, published at `/privacy`, covers data collection, processing, retention (36-hour document deletion), third-party sharing (OpenAI, Crossref), cookie usage, user rights (access, erasure, portability) | ☐ |
| L-03 | Cookie consent banner implemented | 🔴 | Frontend | Granular consent (necessary, analytics, marketing), remembers preference, blocks non-essential cookies until consent, compliant with ePrivacy Directive | ☐ |
| L-04 | GDPR Data Processing Agreements signed | 🔴 | Legal | DPAs executed with: AWS, OpenAI, Anthropic, Stripe, Datadog, Sentry, Google (OAuth) | ☐ |
| L-05 | ICO registration (UK) | 🔴 | DPO | Registration number obtained and displayed in Privacy Policy | ☐ |
| L-06 | Data Subject Access Request process documented | 🔴 | DPO | Internal SOP for handling DSAR within 30-day deadline, tested with mock request | ☐ |
| L-07 | Right to erasure process implemented | 🔴 | Backend | Automated account deletion endpoint that purges all user data from PostgreSQL, S3, Redis, Stripe, and external API logs | ☐ |
| L-08 | AI-generated content disclaimer | 🔴 | Legal / Product | Clear disclaimer on all AI-generated suggestions and explanations stating they are advisory, not guaranteed, visible in UI and Terms of Service | ☐ |
| L-09 | Accessibility statement published | 🟡 | Frontend | Published at `/accessibility`, documents WCAG 2.1 AA conformance level, known limitations, and contact for accessibility issues | ☐ |
| L-10 | Open source licence compliance | 🟡 | Engineering | All third-party dependencies audited, licence compatibility verified (no GPL in proprietary code), NOTICE file generated | ☐ |
| L-11 | Trademark search for "CitePilot" | 🔴 | Legal | Trademark search completed in target markets (UK, EU, US), no conflicts identified, application filed | ☐ |
| L-12 | Stripe terms acceptance | 🔴 | Legal | Stripe Connected Account or Direct integration terms accepted, PCI DSS SAQ-A compliance confirmed | ☐ |

---

## 2. Security

| # | Item | Priority | Owner | Acceptance Criteria | Status |
|---|---|---|---|---|---|
| S-01 | Penetration test completed | 🔴 | Security | Third-party pentest of production environment, all Critical and High findings remediated, report archived | ☐ |
| S-02 | OWASP Top 10 review | 🔴 | Security | All OWASP Top 10 2021 categories reviewed and mitigated: injection, broken auth, sensitive data exposure, XXE, broken access control, security misconfiguration, XSS, insecure deserialisation, insufficient logging, SSRF | ☐ |
| S-03 | Dependency vulnerability scan | 🔴 | Engineering | `npm audit` (Node.js), `pip audit` (Python), `next lint` — zero Critical/High vulnerabilities | ☐ |
| S-04 | Secret scanning enabled | 🔴 | Engineering | GitHub secret scanning and push protection enabled on all repositories | ☐ |
| S-05 | All secrets in AWS Secrets Manager | 🔴 | Platform | No hardcoded secrets in code, environment variables, or Docker images — verified via `trufflehog` scan | ☐ |
| S-06 | API rate limiting configured | 🔴 | Backend | Rate limits enforced per plan tier: Free (10 req/min), Student (30 req/min), Professional (60 req/min), Institutional (120 req/min) | ☐ |
| S-07 | CORS configuration locked | 🔴 | Backend | CORS allows only `https://citepilot.com`, `https://www.citepilot.com`, and `https://app.citepilot.com` | ☐ |
| S-08 | CSP headers configured | 🔴 | Frontend | Content Security Policy headers set — no `unsafe-inline`, no `unsafe-eval`, report-uri configured | ☐ |
| S-09 | HTTP security headers | 🔴 | Platform | `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` all set and verified via securityheaders.com (A+ rating) | ☐ |
| S-10 | SSL/TLS configuration | 🔴 | Platform | TLS 1.2+ only, HSTS preload submitted, SSL Labs grade A+ | ☐ |
| S-11 | Authentication flow security review | 🔴 | Security | NextAuth.js configuration reviewed: CSRF protection, session token rotation, secure cookie flags (`HttpOnly`, `Secure`, `SameSite=Lax`) | ☐ |
| S-12 | File upload validation | 🔴 | Backend | `.docx` and `.pdf` only, max file size 50MB, MIME type validation, virus scanning via ClamAV, file content inspection (magic bytes) | ☐ |
| S-13 | Input sanitisation | 🔴 | Backend | All user inputs sanitised: pasted text (XSS prevention), API parameters (SQL injection prevention via parameterised queries), file names | ☐ |
| S-14 | Logging — no sensitive data | 🔴 | Engineering | Audit of all log statements confirms no PII, passwords, API keys, document content, or session tokens are logged | ☐ |
| S-15 | Incident response plan documented | 🔴 | Security | IR plan reviewed and approved (see Document 27), contact list verified, PagerDuty escalation policies configured | ☐ |
| S-16 | DDoS protection | 🟡 | Platform | AWS Shield Standard enabled (automatic), CloudFront with WAF rules for rate limiting and geo-blocking | ☐ |
| S-17 | Admin panel access controls | 🔴 | Backend | Admin routes require elevated role, IP allowlisting for admin endpoints, audit logging on all admin actions | ☐ |

---

## 3. Performance

| # | Item | Priority | Owner | Acceptance Criteria | Status |
|---|---|---|---|---|---|
| P-01 | Load testing completed | 🔴 | Platform | k6 load test simulating 500 concurrent users: p95 response time < 500ms for API, < 2s for citation analysis (5000-word document) | ☐ |
| P-02 | Stress testing completed | 🔴 | Platform | System remains stable under 2x expected peak load (1000 concurrent users), graceful degradation at 3x | ☐ |
| P-03 | Citation analysis performance benchmarks | 🔴 | AI Team | 5,000-word document: < 15 seconds end-to-end. 20,000-word document: < 45 seconds. 80,000-word thesis: < 3 minutes | ☐ |
| P-04 | Frontend Core Web Vitals | 🔴 | Frontend | LCP < 2.5s, INP < 200ms, CLS < 0.1 on mobile and desktop, verified via Lighthouse CI (score > 90) | ☐ |
| P-05 | Database query performance | 🔴 | Backend | All queries < 100ms at p95, no full table scans on tables > 10K rows, `EXPLAIN ANALYZE` review of top 20 queries | ☐ |
| P-06 | CDN cache hit ratio | 🟡 | Platform | CloudFront cache hit ratio > 85% for static assets (JS, CSS, images, fonts) | ☐ |
| P-07 | Image optimisation | 🟡 | Frontend | All images served as WebP/AVIF via Next.js Image component, lazy loading below the fold | ☐ |
| P-08 | Bundle size budget | 🟡 | Frontend | Initial JS bundle < 200KB gzipped, per-route code splitting configured, no unused dependencies | ☐ |
| P-09 | Database connection pooling | 🔴 | Backend | Connection pool configured: min 5, max 20 per API instance, idle timeout 30s, connection timeout 5s | ☐ |
| P-10 | Redis caching strategy validated | 🔴 | Backend | Cache hit rate > 70% for Crossref lookups in staging environment, TTL values tuned per key prefix | ☐ |
| P-11 | BullMQ queue performance | 🔴 | Backend | Queue processing rate handles 100 concurrent jobs, no memory leaks over 24-hour soak test | ☐ |
| P-12 | Auto-scaling policies configured | 🔴 | Platform | ECS auto-scaling: CPU target 65%, min 2 tasks, max 20 tasks, scale-out within 60 seconds | ☐ |

---

## 4. Analytics & Monitoring

| # | Item | Priority | Owner | Acceptance Criteria | Status |
|---|---|---|---|---|---|
| A-01 | Application Performance Monitoring | 🔴 | Platform | Datadog APM configured for all services: Node.js API gateway, Python FastAPI, Next.js server-side | ☐ |
| A-02 | Error tracking | 🔴 | Engineering | Sentry configured for frontend (Next.js) and backend (Node.js, Python), source maps uploaded, alert rules set | ☐ |
| A-03 | Product analytics | 🔴 | Product | PostHog or Mixpanel tracking: page views, feature usage (uploads, style selection, results interaction), conversion funnel (signup → upload → paid conversion) | ☐ |
| A-04 | Uptime monitoring | 🔴 | Platform | Datadog Synthetics: API health check every 1 minute, browser test (upload flow) every 5 minutes, alerts to PagerDuty | ☐ |
| A-05 | Log aggregation | 🔴 | Platform | All application logs centralised in Datadog Logs, structured JSON logging, log retention 30 days | ☐ |
| A-06 | Business metrics dashboard | 🟡 | Product | Dashboard showing: daily active users, uploads per day, paid conversion rate, revenue (MRR), churn rate, average processing time | ☐ |
| A-07 | Alert runbooks linked | 🔴 | Platform | Every Datadog/PagerDuty alert has a linked runbook URL with investigation and remediation steps | ☐ |
| A-08 | SLO dashboards | 🟡 | Platform | SLO tracking for: API availability (99.95%), citation analysis latency (p95 < 15s), error rate (< 0.1%) | ☐ |
| A-09 | Cost monitoring | 🟡 | Platform | AWS Cost Explorer budget alerts: warning at 80% of monthly budget, critical at 100% | ☐ |
| A-10 | AI token usage tracking | 🔴 | AI Team | OpenAI and Anthropic API token usage tracked per user, per plan, with daily cost aggregation and anomaly alerting | ☐ |

---

## 5. SEO

| # | Item | Priority | Owner | Acceptance Criteria | Status |
|---|---|---|---|---|---|
| SEO-01 | Meta tags on all pages | 🔴 | Frontend | Title, description, og:title, og:description, og:image, twitter:card on landing, pricing, help, login, and all marketing pages | ☐ |
| SEO-02 | Structured data (JSON-LD) | 🟡 | Frontend | `SoftwareApplication` schema on homepage, `FAQPage` schema on help centre, `Organization` schema sitewide | ☐ |
| SEO-03 | Sitemap.xml | 🔴 | Frontend | Auto-generated sitemap at `/sitemap.xml` via Next.js, submitted to Google Search Console and Bing Webmaster Tools | ☐ |
| SEO-04 | robots.txt | 🔴 | Frontend | Published at `/robots.txt`, disallows `/api/`, `/dashboard/`, `/admin/`, allows all marketing pages | ☐ |
| SEO-05 | Canonical URLs | 🔴 | Frontend | `<link rel="canonical">` on all pages, prevents duplicate content from `www` vs non-`www`, trailing slashes | ☐ |
| SEO-06 | Page speed (mobile) | 🔴 | Frontend | Google PageSpeed Insights score > 90 for landing page on mobile | ☐ |
| SEO-07 | Open Graph images | 🟡 | Design | Custom OG images (1200×630) for: homepage, pricing page, help centre, each blog post template | ☐ |
| SEO-08 | 404 page | 🔴 | Frontend | Custom 404 page with navigation, search, and link to homepage — not a blank or default page | ☐ |
| SEO-09 | Heading hierarchy | 🟡 | Frontend | Single `<h1>` per page, logical `<h2>`→`<h6>` hierarchy, no skipped levels | ☐ |
| SEO-10 | Google Search Console verified | 🔴 | Marketing | Domain verified, sitemap submitted, initial crawl completed, no critical errors | ☐ |
| SEO-11 | Blog / content hub | 🟢 | Marketing | At least 5 launch blog posts published: "How to check APA citations", "Common citation mistakes", "AI vs rule-based citation checking", "What is a retracted paper?", "CitePilot vs Reciteworks comparison" | ☐ |

---

## 6. Accessibility

| # | Item | Priority | Owner | Acceptance Criteria | Status |
|---|---|---|---|---|---|
| ACC-01 | WCAG 2.1 AA audit | 🔴 | Frontend | Automated audit (axe-core) + manual review of all user-facing pages, zero Critical violations | ☐ |
| ACC-02 | Keyboard navigation | 🔴 | Frontend | All interactive elements reachable and operable via keyboard, visible focus indicators on all focusable elements, logical tab order | ☐ |
| ACC-03 | Screen reader testing | 🔴 | Frontend | Tested with NVDA (Windows) and VoiceOver (macOS) — all content readable, form labels announced, dynamic results announced via ARIA live regions | ☐ |
| ACC-04 | Colour contrast | 🔴 | Frontend | All text meets 4.5:1 contrast ratio (normal text) and 3:1 (large text), verified with Colour Contrast Analyser | ☐ |
| ACC-05 | Colour-blind safe results | 🔴 | Frontend | Citation results do not rely solely on colour — icons and text labels accompany green/orange/red colour coding | ☐ |
| ACC-06 | Form accessibility | 🔴 | Frontend | All form inputs have visible labels (not placeholder-only), error messages associated via `aria-describedby`, required fields marked with `aria-required` | ☐ |
| ACC-07 | Alt text for images | 🔴 | Frontend | All meaningful images have descriptive alt text, decorative images have `alt=""` | ☐ |
| ACC-08 | Skip navigation link | 🟡 | Frontend | "Skip to main content" link present on all pages, visible on focus | ☐ |
| ACC-09 | Responsive design | 🔴 | Frontend | Fully functional from 320px to 2560px viewport width, no horizontal scrolling, touch targets ≥ 44×44px on mobile | ☐ |
| ACC-10 | Reduced motion support | 🟡 | Frontend | Animations respect `prefers-reduced-motion` media query, essential animations replaced with instant transitions | ☐ |
| ACC-11 | Document upload accessibility | 🔴 | Frontend | Drag-and-drop zone has keyboard-accessible file input alternative, upload progress announced to screen readers | ☐ |

---

## 7. Infrastructure

| # | Item | Priority | Owner | Acceptance Criteria | Status |
|---|---|---|---|---|---|
| I-01 | Production environment deployed | 🔴 | Platform | All ECS services running, RDS provisioned (Multi-AZ), ElastiCache running, S3 buckets created with policies | ☐ |
| I-02 | Domain and DNS configured | 🔴 | Platform | `citepilot.com` → CloudFront, `api.citepilot.com` → ALB, `status.citepilot.com` → Statuspage, SSL certs issued via ACM | ☐ |
| I-03 | SSL certificates | 🔴 | Platform | ACM certificates issued for `*.citepilot.com`, auto-renewal enabled, pinned to CloudFront and ALB | ☐ |
| I-04 | CI/CD pipeline functional | 🔴 | Engineering | GitHub Actions: PR checks (lint, test, build) → staging deploy on merge to `develop` → production deploy on merge to `main` with manual approval gate | ☐ |
| I-05 | Database migrations applied | 🔴 | Backend | All migrations run against production database, schema matches expected state, rollback scripts tested | ☐ |
| I-06 | Backup verification | 🔴 | Platform | RDS automated backups confirmed running, S3 cross-region replication verified, at least one successful restore test completed | ☐ |
| I-07 | Disaster recovery tested | 🔴 | Platform | At least one DR drill completed per DR plan (Document 27), RTO/RPO targets met in test | ☐ |
| I-08 | Auto-scaling configured | 🔴 | Platform | ECS target tracking policies active, tested with synthetic load spike, scale-out observed within 60s | ☐ |
| I-09 | WAF rules deployed | 🔴 | Platform | AWS WAF on CloudFront: rate limiting, SQL injection rules, XSS rules, geo-blocking (if required), bot management | ☐ |
| I-10 | Environment isolation | 🔴 | Platform | Production, staging, and development environments fully isolated: separate VPCs, separate databases, separate API keys | ☐ |
| I-11 | Infrastructure as Code | 🟡 | Platform | All infrastructure defined in Terraform/CloudFormation, no manual console-created resources in production | ☐ |
| I-12 | Secrets rotation schedule | 🔴 | Security | Automatic rotation configured: RDS credentials (90 days), API keys (180 days), session secret (365 days) | ☐ |
| I-13 | Health check endpoints | 🔴 | Backend | `/health` (shallow — returns 200), `/health/deep` (checks DB + Redis + S3 connectivity), used by ALB and monitoring | ☐ |

---

## 8. Support & Operations

| # | Item | Priority | Owner | Acceptance Criteria | Status |
|---|---|---|---|---|---|
| SUP-01 | Help centre published | 🔴 | Product | All help centre content live at `/help` (see Document 29), covering all features and common questions | ☐ |
| SUP-02 | Contact form functional | 🔴 | Frontend / Backend | Contact form at `/contact` sends emails via SES to `support@citepilot.com`, auto-response confirmation sent to user | ☐ |
| SUP-03 | Support email configured | 🔴 | Operations | `support@citepilot.com` inbox monitored, auto-responder confirms receipt with expected response time (24 hours) | ☐ |
| SUP-04 | Support ticketing system | 🟡 | Operations | Ticketing system (Intercom, Zendesk, or Linear) configured for tracking and SLA management | ☐ |
| SUP-05 | On-call rotation established | 🔴 | Engineering | PagerDuty schedule configured with primary and secondary on-call, weekly rotation, escalation to engineering lead after 15 min | ☐ |
| SUP-06 | Runbooks for common issues | 🔴 | Platform | Runbooks documented for: service restart, database failover, Redis flush, deployment rollback, rate limit adjustment, OpenAI quota exceeded | ☐ |
| SUP-07 | Status page configured | 🔴 | Platform | `status.citepilot.com` on Statuspage, components defined (Upload, Analysis, Export, Auth, API, External Validations), subscriber notifications enabled | ☐ |
| SUP-08 | Internal admin dashboard | 🟡 | Backend | Admin panel for: user management, subscription status, document processing queue, system metrics, feature flag management | ☐ |
| SUP-09 | Feedback mechanism | 🟡 | Frontend | In-app feedback widget on results page: "Was this result helpful?" with optional free-text comment, data stored for ML fine-tuning | ☐ |

---

## 9. Marketing & Launch Communications

| # | Item | Priority | Owner | Acceptance Criteria | Status |
|---|---|---|---|---|---|
| M-01 | Landing page live | 🔴 | Marketing / Frontend | Compelling hero section, feature highlights, pricing table, social proof (if available), CTAs to sign up | ☐ |
| M-02 | Pricing page live | 🔴 | Frontend | All plan tiers displayed with feature comparison table, Stripe checkout integration tested with test cards | ☐ |
| M-03 | Product demo / walkthrough | 🟡 | Marketing | Interactive product tour or video walkthrough (< 3 minutes) showing upload → results → correction flow | ☐ |
| M-04 | Email launch sequence | 🟡 | Marketing | Welcome email, onboarding tips (day 2), feature highlight (day 5), upgrade prompt (day 14) — configured in email platform | ☐ |
| M-05 | Social media accounts | 🟡 | Marketing | Twitter/X, LinkedIn, and Instagram accounts created with consistent branding | ☐ |
| M-06 | Press/launch announcement drafted | 🟡 | Marketing | Press release or blog post announcing launch, key differentiators vs Reciteworks, available for publication on launch day | ☐ |
| M-07 | Product Hunt submission prepared | 🟢 | Marketing | Product Hunt listing drafted: tagline, description, screenshots, maker comment, scheduled for launch day | ☐ |
| M-08 | Academic community outreach | 🟡 | Marketing | Identified 10+ academic subreddits, forums, and mailing lists for launch announcements | ☐ |
| M-09 | Comparison page (vs Reciteworks) | 🟡 | Marketing | Feature-by-feature comparison page at `/compare/reciteworks`, factual and professional tone | ☐ |
| M-10 | Referral program | 🟢 | Product | Referral link generation, reward structure defined (e.g., 1 month free for referrer and referee) | ☐ |
| M-11 | Privacy-first messaging | 🔴 | Marketing | All marketing materials accurately represent data handling: 36-hour deletion, encryption, no document storage beyond processing | ☐ |

---

## 10. Functional Verification

| # | Item | Priority | Owner | Acceptance Criteria | Status |
|---|---|---|---|---|---|
| F-01 | Document upload (.docx) | 🔴 | QA | Upload, parse, extract citations, display results — end-to-end test passing on production | ☐ |
| F-02 | Document upload (.pdf) | 🔴 | QA | Upload, parse, extract citations, display results — end-to-end test passing on production | ☐ |
| F-03 | Plain text paste | 🔴 | QA | Paste text, extract citations, display results — end-to-end test passing on production | ☐ |
| F-04 | All 9 citation styles | 🔴 | QA | APA 7, APA 6, Harvard, Vancouver, Chicago, MLA, IEEE, OSCOLA, Turabian — each tested with a sample document containing 10+ citations | ☐ |
| F-05 | AI citation matching | 🔴 | QA / AI Team | AI correctly matches in-text citations to reference list entries with > 95% precision and > 90% recall on test corpus | ☐ |
| F-06 | AI explanations | 🔴 | QA / AI Team | AI provides human-readable explanations for each flagged issue, explanations are contextually accurate | ☐ |
| F-07 | Crossref validation | 🔴 | QA | References validated against Crossref API, real papers confirmed, fabricated papers flagged, within acceptable latency | ☐ |
| F-08 | Retraction Watch check | 🔴 | QA | Known retracted papers correctly flagged when included in test document | ☐ |
| F-09 | Hallucinated citation detection | 🔴 | QA / AI Team | Fabricated citations (non-existent papers) correctly identified and flagged in 90%+ of test cases | ☐ |
| F-10 | Multi-reference-list support | 🔴 | QA | Document with 3+ chapters, each with its own reference list, correctly parsed and cross-referenced per chapter | ☐ |
| F-11 | User registration (email/password) | 🔴 | QA | Register, verify email, login, access dashboard — full flow on production | ☐ |
| F-12 | Google OAuth login | 🔴 | QA | Google login, account creation, subsequent logins — verified on production with real Google account | ☐ |
| F-13 | Microsoft OAuth login | 🔴 | QA | Microsoft login, account creation, subsequent logins — verified on production with real Microsoft account | ☐ |
| F-14 | Stripe subscription flow | 🔴 | QA | Upgrade to Student plan, verify access to paid features, downgrade, verify access revoked — tested with Stripe test mode on staging, live mode smoke test on production | ☐ |
| F-15 | PDF export | 🔴 | QA | Export results as PDF with colour-coded annotations, verify content accuracy and formatting | ☐ |
| F-16 | Free tier rate limits | 🔴 | QA | Verify 3 uploads/day limit, 5000-word limit, 100-reference limit — correct error messages displayed | ☐ |
| F-17 | 36-hour document deletion | 🔴 | QA | Upload a document, verify it is automatically deleted after 36 hours (can be tested with reduced TTL in staging) | ☐ |
| F-18 | Results colour coding | 🔴 | QA | Green (matched), orange (possible match), red (no match) — verified visually and with colour-blind accessible alternatives | ☐ |
| F-19 | Filter functionality | 🟡 | QA | Filter results by: issues only, style warnings, year, author — all filters work correctly in combination | ☐ |
| F-20 | Ignore button | 🟡 | QA | "Ignore" a flagged citation, verify it's removed from issue count, persists across page refreshes within session | ☐ |

---

## 11. Launch Day Procedure

### Pre-Launch (T-24 hours)

| Time | Action | Owner |
|---|---|---|
| T-24h | Final production deployment from `main` branch | Engineering Lead |
| T-24h | Run full end-to-end test suite against production | QA Lead |
| T-24h | Verify all monitoring dashboards and alerts are functioning | Platform Lead |
| T-18h | Pre-warm CloudFront cache by requesting all static pages | Platform Engineer |
| T-12h | Final backup of production database (manual snapshot) | Platform Engineer |
| T-12h | All team members confirm availability for launch day | Engineering Lead |

### Launch (T-0)

| Time | Action | Owner |
|---|---|---|
| T-0 | Remove beta/coming-soon gate if present | Frontend Lead |
| T-0 | Publish landing page, pricing page, help centre | Marketing Lead |
| T-0 | Send launch announcement email | Marketing |
| T-0 | Publish social media announcements | Marketing |
| T+5m | Verify first external user can register and upload | QA |
| T+15m | Check error rates, response times, and system metrics | On-call Engineer |
| T+1h | First status check — all systems nominal | Engineering Lead |

### Post-Launch (T+1 to T+72 hours)

| Time | Action | Owner |
|---|---|---|
| T+1h | Review first batch of user feedback | Product |
| T+4h | Review error tracking (Sentry) for new issues | Engineering |
| T+24h | Daily metrics review: signups, uploads, errors, conversion | Product + Engineering |
| T+48h | Triage and prioritise any critical bugs discovered | Engineering Lead |
| T+72h | Launch retrospective meeting | All Leads |

---

## Sign-Off

| Role | Name | Date | Signature |
|---|---|---|---|
| CTO | | | |
| VP Engineering | | | |
| Product Lead | | | |
| Engineering Lead | | | |
| QA Lead | | | |
| Security Lead | | | |
| Marketing Lead | | | |
| Legal / DPO | | | |

> **Launch is approved when all 🔴 items are ✅ and all 🟡 items are either ✅ or have documented risk acceptance signed by the CTO.**
