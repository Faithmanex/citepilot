# Production Readiness — Task List

Priority order is **delivery first**: the audit result a researcher sees must be
truthful and complete before anything else. UI, platform hardening, then
subscription last.

Status key: `[x]` done and verified · `[~]` in progress · `[ ]` open · `[!]` blocked

Last updated: 2026-11-18

---

## P0 — Delivery core: the audit itself

| # | Task | Status | Evidence / acceptance |
|---|---|---|---|
| 1.1 | Audit completes all six checks inside the budget | `[x]` | Demo manuscript: six consecutive `completed` runs, 6/6 checks, 9.8s–42.5s. |
| 1.2 | Retracted reference is detected and reported | `[x]` | Mehra et al. 2020 → `retraction_info.is_retracted = true`, status `retracted`, message cites Crossref's retraction relation. |
| 1.3 | Orphaned reference is detected | `[x]` | Bishop (2006) → `status = orphaned` (no in-text citation). |
| 1.4 | Unmatched in-text citations become findings | `[x]` | `no_match` → `UNMATCHED_CITATION` suggestions (`suggestionAdapter.ts:87`); `(Smith et al 2020)` and `(Johnson & Wang, 2022)` reported. |
| 1.5 | Unverifiable references are not reported as clean | `[x]` | `not_found` maps to a finding; export counts `not_found` as unverified. |
| 1.6 | Crossref field discrepancies: first author, journal, volume, page range | `[x]` | LeCunn entry → `author`, `journal`, `pages`, `title` discrepancies against Crossref. OpenAlex performs the same comparisons (`title`, `year`, `doi`, `journal`, `volume`, `pages`) as the fallback provider. |
| 1.7 | Style warnings: comma, page indicator, page range, capitalisation | `[x]` | `MISSING_COMMA_IN_CITATION`, `MISSING_PAGE_INDICATOR`, `INCONSISTENT_PAGE_RANGE` (`436-44`), `TITLE_CAPITALIZATION`. |
| 1.8 | Uncited statistical claims are detected | `[x]` | Three claims (87%, 42%, 63%) returned. |
| 1.9 | Recency reports source age | `[x]` | 16.7% within 5 years, average age 9.2 years, 2 sources older than 10 years. |
| 1.10 | A partial audit never renders as clean | `[x]` | `pipeline-completeness` tests; widget prints "so far" / "not checked". |
| 1.11 | Repeat runs are stable | `[x]` | Six consecutive `completed` runs with the same finding set. |
| 1.12 | Stale exports are blocked; reports list only real findings | `[x]` | `0d6bb57`; export code unchanged by this pass. |
| 1.13 | Crossref/OpenAlex may not adopt unrelated records | `[x]` | `titlesRelated` gate on both providers (exact title, or prefix for subtitle/edition extensions — never containment, which falsely flagged Bishop 2006); OpenAlex uses `filter=title.search` and skips derivative records (book-review, paratext, erratum, peer-review, retraction) that merely describe the cited work; fabricated DOIs report `not_found` instead of inheriting a stranger's metadata; OpenAlex reports `not_consulted` when Crossref already verified. |
| 1.14 | Transient HTTP failures are retried with backoff | `[x]` | `getJson`: one retry for 5xx/network, two bounded waits for 429 honouring `Retry-After`. |
| 1.15 | One slow model call cannot starve the audit | `[x]` | One bounded window per stage (`min(global, start+28s)`, no stage retry), global LLM gate at 3 in-flight calls, timeout terminal at the provider client. |
| 1.16 | Style stage payload is compact | `[x]` | Prompt carries raw citation/reference text (8KB cap) instead of up to 60KB of pretty-printed JSON; stage dropped from ~20s timeouts to 2–7s. |
| 1.17 | A check that did not run never produces findings | `[x]` | When matching fails, citations report `unchecked` and references `unchecked` — not `no_match`/`orphaned`; covered by `pipeline-completeness.test.ts`. |
| 1.18 | An unconfirmed retraction check states why and what the author must do | `[x]` | `unknown` results carry the reason, `action_required: true`, and manual-verification guidance; the editor shows "Retraction status not confirmed" (medium, not an accusation) and the PDF lists those sources under "Retraction Status Not Confirmed — Action Required". Verified live: Bishop 2006, Doe 2020, Nguyen & Park 2023 → `unknown` + guidance; Krizhevsky/LeCunn/Mehra → `normal`/`retracted` with no action. |
| 1.19 | A clean reference is never reported as retracted | `[x]` | Regression fixed: the editor tested for the presence of `retraction_info`, which every reference has, so every clean reference rendered "Retracted Academic Paper Detected"; now only `status: "retracted"` or `is_retracted: true` does. |
| 1.20 | A fallback-verified reference is not also reported as unverified | `[x]` | `crossref_validation.status` now takes the fallback provider's verdict (`verified` / `discrepancies_found`) with `provider: "openalex" \| "openlibrary"`, so Bishop 2006 is no longer counted as "could not be verified" nor shown as "not found in Crossref". |
| 1.21 | A partly checked stage reports `partial`, not `unavailable` | `[x]` | Live preview run: 5 of 6 references verified, one OpenAlex lookup failed → verification is `partial` ("1 of 6 references could not be checked by every provider"), the audit is `partial`, the summary says "incomplete coverage" and the count is not replaced by a fake zero. `pipeline-completeness` + `auditState` + widget tests. |
| 1.22 | A rate-limited provider is reported as unverified with an action, not as a clean miss | `[x]` | OpenAlex 429 → `verification_unavailable` with "rate-limited … unverified, not confirmed correct" and the retry/manual-check guidance; `HttpError` carries the provider's `reason`, so a spent daily budget is not retried three times; `api_key` is redacted from every surfaced message. |
| 1.23 | Free-tier word count never double-counts a pasted manuscript | `[x]` | On the live site a 1,600-word paste without a "References" heading was rejected as **3,200 words**: `splitBodyAndReferences` returned the full text as both body and references. Headingless input is now classified: a clear bibliography → reference-only; everything else → body-only, with the references check reported as not applicable. An explicit reference-only mode still exists for bare lists. |
| 1.24 | A reference whose provider never answered is named in the findings | `[x]` | The live audit intermittently failed the Crossref lookup for one reference (stage `partial`); the reference previously produced only "Retraction status not confirmed". It now gets "Metadata verification not confirmed by Crossref", with the provider's reason, the retry/manual-check guidance, and `actionRequired: true`. |

## P1 — Delivery surface: what the researcher touches

| # | Task | Status | Evidence / acceptance |
|---|---|---|---|
| 2.1 | Every finding kind reaches the suggestion list | `[x]` | Retraction, Crossref discrepancy, `not_found`, `no_match`, style, claims all mapped in `suggestionAdapter.ts`. |
| 2.2 | Accept / dismiss actually changes the manuscript text | `[ ]` | Needs an interactive run; editor unit tests exist but do not cover the accept round-trip. |
| 2.3 | History save and restore reflect the real audit | `[ ]` | `/api/audits/save` requires a configured Supabase project and a test account. |
| 2.4 | No fabricated content in the product UI | `[x]` | Fabricated testimonials deleted; landing demo labelled "Example document". |
| 2.5 | Accessibility: labels, focus order, `aria-live` on results | `[ ]` | Keyboard-only and screen-reader passes outstanding. |

## P2 — Platform and security

| # | Task | Status | Evidence / acceptance |
|---|---|---|---|
| 3.1 | No Supabase placeholder project fallback | `[x]` | `isSupabaseConfigured`; clients return null or throw a named error. |
| 3.2 | Paid entitlement enforced server-side | `[x]` | 1,600-word request → `403 word_limit_exceeded` with the upgrade message; pro tiers unlimited. |
| 3.3 | Tier cannot be self-granted via auth metadata | `[x]` | Fallback profile tier is always `free`. |
| 3.4 | Rate limiting holds across serverless instances | `[x]` | Migration `016_create_rate_limits.sql` adds an atomic `consume_rate_limit` RPC (service-role only, RLS with no policies); `checkRateLimit` uses it and returns `429` + `Retry-After`. Per-instance window remains only as a logged degradation if the store is unreachable. 7 tests in `rate-limit.test.ts`. |
| 3.5 | API-key comparison is timing-safe | `[x]` | `timingSafeEqual` with length check. |
| 3.6 | Health and readiness endpoints are truthful | `[x]` | `/api/health`, `/health`, cached probes. |
| 3.7 | Provider failures never discard the manuscript | `[x]` | Error bodies state the text is preserved. |
| 3.8 | OpenAlex API key configured in production | `[x]` | OpenAlex dropped the `mailto` polite pool in February 2026; keyless traffic shares a small budget per egress IP and returned HTTP 429 from Vercel. `OPENALEX_API_KEY` is read from the environment and sent as `api_key`; `/api/health` reports `openalex_key_configured: true` in Production, Preview and Development, and the production audit (2026-11-18) verified Bishop 2006 through OpenAlex with no 429. |

## P3 — Subscription and billing (deferred: the product stays free for now)

Billing is intentionally not being configured as of 2026-11-19. The code fails closed, and the free tier (1,500 words per audit, every check enabled) works anonymously on production. PayPal values are only needed when the decision changes.

| # | Task | Status | Evidence / acceptance |
|---|---|---|---|
| 4.1 | Activation fails closed without PayPal credentials | `[x]` | 503 before any grant; test coverage in `billing.test.ts`. |
| 4.2 | Plan identity is enforced | `[x]` | Client claim and PayPal `plan_id` must equal `NEXT_PUBLIC_PAYPAL_PLAN_ID`. |
| 4.3 | Webhook signature is mandatory | `[x]` | Missing `PAYPAL_WEBHOOK_ID` → 503; no unsigned dev path. |
| 4.4 | Sale events resolve the subscription, not the sale ID | `[x]` | `PAYMENT.SALE.COMPLETED` uses `billing_agreement_id`. |
| 4.5 | Billing period is never invented | `[x]` | `current_period_end` is PayPal's `next_billing_time` or null. |
| 4.6 | Checkout shows success only after server confirmation | `[x]` | Button awaits `/api/subscription/activate` and surfaces failures. |
| 4.7 | No hardcoded plan/client IDs | `[x]` | Read from `NEXT_PUBLIC_PAYPAL_*`; unconfigured → "checkout is not configured". |
| 4.8 | Cancellation keeps access until the paid period ends | `[x]` | Webhook keeps the tier when `current_period_end` is in the future; `resolveAuditEntitlement` and `AuthContext` apply expiry lazily. |
| 4.9 | Production env vars set and redeployed | `[~]` | Deferred by the user: the site stays free for now, so no PayPal values are being requested. AI vars, `OPENALEX_API_KEY` and `NEXT_PUBLIC_APP_URL=https://citepilot-web.vercel.app` are set in Production and deployed (3.8, 5.6). Supabase is still needed for accounts/history and migration 016. Local `.env.local` keeps `http://localhost:3000` so development redirects stay local. |

## P4 — Verification and documentation

| # | Task | Status | Evidence / acceptance |
|---|---|---|---|
| 5.1 | `typecheck`, `lint`, full `test` green | `[x]` | 33 files / 299 tests; typecheck and lint clean. |
| 5.2 | Billing tests cover fail-closed paths | `[x]` | 9 tests: 503 (no plan, no creds), 401, plan mismatch, non-ACTIVE, happy path, webhook 503/401/bad signature. |
| 5.3 | `AUDIT-FINDINGS-REGISTER.md` updated | `[x]` | §7 records this pass. |
| 5.4 | `LEARNING.md` updated | `[x]` | Provider-latency, retry, and billing gotchas. |
| 5.5 | Billing runbook | `[x]` | `BILLING-RUNBOOK.md` at the repo root: verify a subscription, replay a webhook, downgrade a user, common failures. |
| 5.6 | Production deployed to its real domain and smoke-tested | `[x]` | **https://citepilot-web.vercel.app** (production alias of project `citepilot`, team `echelnet`). `/`, `/dashboard`, `/auth/login`, `/privacy` → 200; `/api/health?probe=1` → `ai_engine_ready: true`, `gemini-3.1-flash-lite`; demo audit → `completed`, 6/6 checks, 11.9s; PDF export → 200 (3,150 bytes). The previous production build still ran the broken `gemini-3.8-flash`; it now serves the fixed build. Supabase/PayPal values remain (4.9). |
