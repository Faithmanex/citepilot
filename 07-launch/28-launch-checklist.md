# 28 — Pre-Launch Checklist

> **Document ID**: CP-LAUNCH-028
> **Version**: 1.1
> **Last Updated**: 2026-08-11
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
| L-02 | Privacy Policy published | 🔴 | Legal / DPO | GDPR and UK GDPR compliant, published at `/privacy`, covers data collection, processing, retention (36-hour document discard), third-party sharing (Google Gemini, Crossref, PayPal), cookie usage, user rights (access, erasure) | ☐ |
| L-03 | Cookie usage reviewed | 🟢 | Frontend | No cookies set in MVP (sessionStorage only). If analytics cookies are added later, implement a consent banner before enabling them | ☐ |
| L-04 | GDPR Data Processing Agreements signed | 🔴 | Legal | DPAs executed as needed with: Google (Gemini APIs), PayPal, Vercel, Railway, Crossref | ☐ |
| L-05 | ICO registration (UK) | 🔴 | DPO | Registration number obtained and displayed in Privacy Policy | ☐ |
| L-06 | Data Subject Access Request process documented | 🔴 | DPO | Internal SOP for handling DSAR within 30-day deadline, tested with mock request | ☐ |
| L-07 | Data discard verified | 🔴 | Backend | Sessionless processing confirmed: no accounts, uploaded documents discarded after the audit (in-memory), nothing persisted beyond 36 hours | ☐ |
| L-08 | AI-generated content disclaimer | 🔴 | Legal / Product | Clear disclaimer on all AI-generated suggestions and explanations stating they are advisory, not guaranteed, visible in UI and Terms of Service | ☐ |
| L-09 | Accessibility statement published | 🟡 | Frontend | Published at `/accessibility`, documents WCAG 2.1 AA as a target (not a conformance claim), known limitations, and contact for accessibility issues | ☐ |
| L-11 | Trademark search for "CitePilot" | 🔴 | Legal | Trademark search completed in target markets (UK, EU, US), no conflicts identified, application filed | ☐ |
| L-12 | PayPal merchant terms accepted | 🔴 | Legal | PayPal merchant agreement accepted, subscription plan configuration confirmed (Professional at $12.99/month) | ☐ |

---

## 2. Security

| # | Item | Priority | Owner | Acceptance Criteria | Status |
|---|---|---|---|---|---|
| S-01 | Penetration test completed | 🔴 | Security | Third-party pentest of production environment, all Critical and High findings remediated, report archived | ☐ |
| S-02 | OWASP Top 10 review | 🔴 | Security | All OWASP Top 10 2021 categories reviewed and mitigated: injection, broken auth, sensitive data exposure, XXE, broken access control, security misconfiguration, XSS, insecure deserialisation, insufficient logging, SSRF | ☐ |
| S-03 | Dependency vulnerability scan | 🔴 | Engineering | `npm audit` (Node.js), `pip-audit` (Python), `npm run typecheck` — zero Critical/High vulnerabilities | ☐ |
| S-04 | Secret scanning enabled | 🔴 | Engineering | GitHub secret scanning and push protection enabled on all repositories | ☐ |
| S-05 | All secrets in platform env vars | 🔴 | Platform | No hardcoded secrets in code or committed to git — secrets stored as Vercel/Railway environment variables, verified via `trufflehog` scan | ☐ |
| S-06 | API rate limiting | 🟡 | Backend | Per-plan API rate limiting (roadmap). Free-tier daily upload cap (3/day) is enforced client-side today | ☐ |
| S-07 | CORS configuration locked | 🔴 | Backend | CORS allows only `https://citepilot.com` and `https://www.citepilot.com` | ☐ |
| S-08 | CSP headers configured | 🔴 | Frontend | Content Security Policy headers set — no `unsafe-inline`, no `unsafe-eval`, report-uri configured | ☐ |
| S-09 | HTTP security headers | 🔴 | Platform | `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` all set and verified via securityheaders.com (A+ rating) | ☐ |
| S-10 | SSL/TLS configuration | 🔴 | Platform | TLS 1.2+ only, HSTS preload submitted, SSL Labs grade A+ | ☐ |
| S-11 | Authentication flow security review | 🟢 | Security | Not applicable in MVP — no authentication. Revisit (OAuth + sessions) when accounts ship | ☐ |
| S-12 | File upload validation | 🔴 | Backend | `.docx`, `.pdf`, `.txt`, `.rtf`, `.bib` only, max file size 50MB, MIME type validation, file content inspection (magic bytes). Virus scanning on roadmap | ☐ |
| S-13 | Input sanitisation | 🔴 | Backend | All user inputs sanitised: pasted text (XSS prevention), API parameters (SQL injection prevention via parameterised queries), file names | ☐ |
| S-14 | Logging — no sensitive data | 🔴 | Engineering | Audit of all log statements confirms no PII, passwords, API keys, document content, or session tokens are logged | ☐ |
| S-15 | Incident response plan documented | 🔴 | Security | IR plan reviewed and approved (see Document 27), escalation contact list verified | ☐ |
| S-16 | DDoS protection | 🟡 | Platform | Managed DDoS protection provided by Vercel/Railway edge (automatic). No custom WAF configured | ☐ |
| S-17 | Admin panel access controls | 🟢 | Backend | Not applicable — no admin panel in MVP. Introduce with institutional plans (roadmap) | ☐ |

---

## 3. Performance

| # | Item | Priority | Owner | Acceptance Criteria | Status |
|---|---|---|---|---|---|
| P-01 | Load testing completed | 🔴 | Platform | k6 load test simulating 500 concurrent users: p95 response time < 500ms for API, < 2s for citation analysis (5000-word document) | ☐ |
| P-02 | Stress testing completed | 🔴 | Platform | System remains stable under 2x expected peak load (1000 concurrent users), graceful degradation at 3x | ☐ |
| P-03 | Citation analysis performance benchmarks | 🔴 | AI Team | 5,000-word document: < 15 seconds end-to-end. 20,000-word document: < 45 seconds. 80,000-word thesis: < 3 minutes | ☐ |
| P-04 | Frontend Core Web Vitals | 🔴 | Frontend | LCP < 2.5s, INP < 200ms, CLS < 0.1 on mobile and desktop, verified via Lighthouse CI (score > 90) | ☐ |
| P-05 | Database query performance | 🔴 | Backend | All queries < 100ms at p95, no full table scans on tables > 10K rows, `EXPLAIN ANALYZE` review of top 20 queries | ☐ |
| P-06 | CDN cache hit ratio | 🟡 | Platform | Vercel CDN cache hit ratio > 85% for static assets (JS, CSS, images, fonts) | ☐ |
| P-07 | Image optimisation | 🟡 | Frontend | All images served as WebP/AVIF via Next.js Image component, lazy loading below the fold | ☐ |
| P-08 | Bundle size budget | 🟡 | Frontend | Initial JS bundle < 200KB gzipped, per-route code splitting configured, no unused dependencies | ☐ |
| P-09 | Database connection pooling | 🔴 | Backend | Connection pool configured: min 5, max 20 per API instance, idle timeout 30s, connection timeout 5s | ☐ |
| P-10 | Crossref lookup caching | 🟢 | Backend | No cache in MVP — Crossref lookups hit the API directly. Caching layer (roadmap) to reduce duplicate lookups and latency | ☐ |
| P-11 | Queue / async processing | 🟢 | Backend | MVP is synchronous (per-audit processing). Queue + websocket backlog handling on roadmap | ☐ |
| P-12 | Auto-scaling | 🟢 | Platform | Managed by Vercel/Railway (automatic). No manual scaling configuration | ☐ |

---

## 4. Analytics & Monitoring

| # | Item | Priority | Owner | Acceptance Criteria | Status |
|---|---|---|---|---|---|
| A-01 | Application Performance Monitoring | 🟢 | Platform | APM on roadmap (none in MVP). Monitor: request latency, error rates via platform logs | ☐ |
| A-02 | Error tracking | 🟡 | Engineering | Error tracking on roadmap (e.g., Sentry). For launch: review platform logs for uncaught errors | ☐ |
| A-03 | Product analytics | 🟢 | Product | Analytics on roadmap (no tracking in MVP — privacy-first). Conversion funnel tracked when accounts ship | ☐ |
| A-04 | Uptime monitoring | 🟡 | Platform | Scheduled availability checks against `/health`; email alerts to the team (no status page in MVP) | ☐ |
| A-05 | Log aggregation | 🟡 | Platform | Structured JSON logging across services; review via Vercel/Railway platform logs | ☐ |
| A-06 | Business metrics dashboard | 🟡 | Product | Dashboard showing: uploads per day, audits completed, PayPal conversion, revenue (MRR), average processing time | ☐ |
| A-07 | Alert runbooks linked | 🟡 | Platform | Every alert (email/platform notification) has a linked runbook URL with investigation and remediation steps | ☐ |
| A-08 | SLO dashboards | 🟢 | Platform | Target SLOs tracked manually: API availability ≥ 99.9%, citation analysis p95 < 2 min, error rate < 1% | ☐ |
| A-09 | Cost monitoring | 🟡 | Platform | Vercel/Railway/Google Gemini API budgets: warning at 80% of monthly budget, critical at 100% | ☐ |
| A-10 | AI token usage tracking | 🔴 | AI Team | Google Gemini token usage tracked per audit, with daily cost aggregation and anomaly alerting | ☐ |

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
| I-01 | Production environment deployed | 🔴 | Platform | Web app deployed on Vercel, AI service on Railway, Vercel Postgres database reachable from both, PayPal button live | ☐ |
| I-02 | Domain and DNS configured | 🔴 | Platform | `citepilot.com` and `www.citepilot.com` → Vercel; AI API exposed via Railway/Vercel rewrites with CORS allowlist (see `citepilot-gateway/src/server.ts`) | ☐ |
| I-03 | SSL/TLS | 🔴 | Platform | Managed certificates auto-issued and auto-renewed by Vercel/Railway (TLS 1.2+) | ☐ |
| I-04 | CI/CD pipeline functional | 🔴 | Engineering | PR checks (typecheck, test, build) via GitHub Actions → production deploy via `vercel --prod` (web) and Railway (AI) | ☐ |
| I-05 | Database migrations applied | 🔴 | Backend | All Drizzle migrations run against the production database, schema matches `supabase/migrations`, rollback scripts tested | ☐ |
| I-06 | Backup verification | 🔴 | Platform | Vercel Postgres automated backups confirmed, at least one successful restore test completed | ☐ |
| I-07 | Disaster recovery tested | 🔴 | Platform | At least one DR drill completed per DR plan (Document 27), RTO/RPO targets met in test | ☐ |
| I-08 | Auto-scaling | 🟢 | Platform | Managed by Vercel/Railway (automatic); no manual configuration required | ☐ |
| I-09 | Web Application Firewall | 🟢 | Platform | No custom WAF — Vercel/Railway edge protections only | ☐ |
| I-10 | Environment isolation | 🔴 | Platform | Production, staging, and development environments isolated: separate projects, separate environments, separate API keys | ☐ |
| I-11 | Infrastructure as Code | 🟢 | Platform | No IaC in MVP — environment configuration documented in runbooks (Vercel/Railway dashboards) | ☐ |
| I-12 | Secrets rotation schedule | 🔴 | Security | API keys rotated on schedule: Google Gemini (90 days), PayPal (180 days) | ☐ |
| I-13 | Health check endpoints | 🔴 | Backend | `/health` (shallow — returns 200) and `/health/deep` (checks DB connectivity) reachable from the public internet | ☐ |

---

## 8. Support & Operations

| # | Item | Priority | Owner | Acceptance Criteria | Status |
|---|---|---|---|---|---|
| SUP-01 | Support documentation drafted | 🔴 | Product | Help centre content finalised (see Document 29). Publishing at `/help` is on roadmap — support runs via email today | ☐ |
| SUP-02 | Support email configured | 🔴 | Operations | `support@citepilot.com` inbox monitored, auto-responder confirms receipt with expected response time (24 hours) | ☐ |
| SUP-03 | Support ticketing system | 🟢 | Operations | Ticketing on roadmap (email inbox + shared tracker suffice for launch) | ☐ |
| SUP-04 | On-call rotation established | 🟡 | Engineering | On-call rotation defined with primary and secondary contacts, escalation by email/phone | ☐ |
| SUP-05 | Runbooks for common issues | 🔴 | Platform | Runbooks documented for: deployment rollback, Gemini quota exceeded, Crossref outage, database restore, PayPal payment failures | ☐ |
| SUP-06 | Status page | 🟢 | Platform | No public status page in MVP (roadmap) | ☐ |
| SUP-07 | Admin dashboard | 🟢 | Backend | Not applicable — no accounts/admin in MVP. Introduce with institutional plans | ☐ |
| SUP-08 | Feedback mechanism | 🟡 | Frontend | In-app feedback controls (👎/👍 on flags) already present; results-page feedback widget on roadmap | ☐ |

---

## 9. Marketing & Launch Communications

| # | Item | Priority | Owner | Acceptance Criteria | Status |
|---|---|---|---|---|---|
| M-01 | Landing page live | 🔴 | Marketing / Frontend | Compelling hero section, feature highlights, pricing table, CTAs to open the free workspace | ☐ |
| M-02 | Pricing page live | 🔴 | Frontend | All plan tiers displayed with feature comparison table, PayPal subscription flow tested (sandbox + live smoke test) | ☐ |
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
| F-08 | Retraction check | 🔴 | QA | Known retracted papers correctly flagged when included in test document | ☐ |
| F-09 | Hallucinated citation detection | 🔴 | QA / AI Team | Fabricated citations (non-existent papers) correctly identified and flagged in 90%+ of test cases | ☐ |
| F-10 | Multi-reference-list support | 🔴 | QA | Document with 3+ chapters, each with its own reference list, correctly parsed and cross-referenced per chapter | ☐ |
| F-11 | Sessionless usage confirmed | 🔴 | QA | No sign-in required anywhere: open workspace, upload, audit — full flow on production | ☐ |
| F-12 | Free-tier caps enforced | 🔴 | QA | Verify 3 uploads/day limit, 5,000-word limit, 100-reference limit — correct error messages displayed | ☐ |
| F-13 | PayPal subscription flow | 🔴 | QA | Subscribe via PayPal button, confirm activation, cancel from PayPal — sandbox + live smoke test on production | ☐ |
| F-14 | PDF export | 🔴 | QA | Export results as PDF with colour-coded annotations, verify content accuracy and formatting | ☐ |
| F-15 | DOCX export | 🔴 | QA | Export annotated DOCX manuscript with highlights and comments, verify content accuracy | ☐ |
| F-16 | Publication recency analysis | 🔴 | QA | Recency breakdown by publication year computes correctly for sample documents | ☐ |
| F-17 | Document discard | 🔴 | QA | Verify uploaded documents are discarded after the audit (in-memory processing, nothing persisted) | ☐ |
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
| T-24h | Verify monitoring checks and alert contacts are functioning | Platform Lead |
| T-18h | Pre-warm Vercel CDN cache by requesting all static pages | Platform Engineer |
| T-12h | Final backup snapshot of production database | Platform Engineer |
| T-12h | All team members confirm availability for launch day | Engineering Lead |

### Launch (T-0)

| Time | Action | Owner |
|---|---|---|
| T-0 | Remove beta/coming-soon gate if present | Frontend Lead |
| T-0 | Publish landing page, pricing page, help centre | Marketing Lead |
| T-0 | Send launch announcement email | Marketing |
| T-0 | Publish social media announcements | Marketing |
| T+5m | Verify first external user can upload and audit | QA |
| T+15m | Check error rates, response times, and system metrics | On-call Engineer |
| T+1h | First status check — all systems nominal | Engineering Lead |

### Post-Launch (T+1 to T+72 hours)

| Time | Action | Owner |
|---|---|---|
| T+1h | Review first batch of user feedback | Product |
| T+4h | Review error tracking and platform logs for new issues | Engineering |
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
