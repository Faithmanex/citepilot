# CitePilot — Remediation Findings Register

Document ID: CP-REMEDIATION-002
Version: 1.2
Last Updated: 2026-11-15
Companion: `REMEDIATION-PLAN.md` (CP-REMEDIATION-001)

Each finding below is linked to the change that resolves it and to the evidence gathered. "Verified" means the behaviour was exercised locally against the real application (not only asserted in a test).

## Review corrections — 2026-11-14

The original tables below record the earlier implementation and evidence, not current proof that every release gate is closed. The follow-up code review reopened five issues. This section supersedes conflicting closure claims in rows 1.9, 2.4, 4.4, and 4.6. These corrections are covered by automated regression tests; no new production, payment, or screen-reader verification is claimed.

| Review issue | Corrected behavior | Regression evidence |
| --- | --- | --- |
| Late response overwrites a replacement document | A request generation guard rejects obsolete responses before callbacks, success notifications, and history saving; replacement/history/settings/input changes invalidate it. | Hook tests assert no success callback, toast, or save after replacement. Dashboard test includes returned old manuscript text and asserts replacement text survives. |
| Reference-only result replaces full manuscript | Existing editor text remains authoritative; server extraction initializes file-only input. The response is copied without mutating shared data. History saves the preserved or extracted manuscript. | Hook test returns reference-only text and asserts the full manuscript survives. |
| Some unavailable references/providers reported completed | Any unavailable Crossref, OpenAlex, or retraction check marks verification unavailable and the audit partial. | Pipeline tests fail one of two references for each provider, plus an all-success control. |
| RTF/BibTeX parsers bypassed | Dashboard retains encoded uploads as files for server normalization; raw encoded content is not submitted as plain manuscript text. | Hook and dashboard tests verify multipart file submission for both extensions and normalized text/current results after success. |
| Stale evidence exported without revision context | Annotated DOCX and diagnostic PDF require current audit evidence. Users must re-audit after changing the manuscript or settings; plain DOCX remains available. | Export availability test asserts both evidence buttons disabled and plain DOCX enabled for stale results. |

Current completion boundary: these five code corrections are implemented locally. Deployment, uploaded-file journeys on the deployed UI, real screen-reader use, authenticated ownership, and sandbox subscription activation remain open as listed in section 6. Earlier artifact tests remain useful but do not prove those release gates.

Follow-up verification: full suite passed 236 tests across 26 files; after adding two upload integration cases, the dashboard suite passed all 8 tests (238 total cases in the current suite). TypeScript passed. This follow-up did not rerun a production deployment or live provider calls.

## 1. Analysis reliability

| # | Finding | Fix | Verification |
|---|---|---|---|
| 1.1 | A short analysis returned HTTP 503 after ~58s with Gemini `DEADLINE_EXCEEDED` | Root cause found: the configured default model `gemini-3.8-flash` is listed by the account but **never returned** (still hanging after 90s). Default changed to `gemini-3.1-flash-lite`, verified with a real call on 2026-11-15 (1.7s); `gemini-2.5-flash` is also verified. `src/lib/ai/config.ts` | Provider catalogue returned 200 and listed the model; direct REST/SDK calls to `gemini-3.8-flash` timed out at 30s/90s/120s; `gemini-3.1-flash-lite` answered a minimal request in 1.7s and the full pipeline completed twice with it (19.1s / 26.8s, all checks). |
| 1.2 | SDK/inline timeouts did not bound a hung provider call | Every provider call is raced against a wall-clock timeout (`withTimeout` in `llm.ts`), and each attempt is capped by the remaining overall budget (`attemptTimeout = min(GEMINI_TIMEOUT_MS, remaining)`) | Failure harness with `GEMINI_TIMEOUT_MS=800`, `ANALYSIS_BUDGET_MS=1200`, slow model: `504 provider_timeout` in **983 ms** with `retryable: true`. |
| 1.3 | Invalid credentials could be retried pointlessly | Errors classified (`timeout`, `rate_limit`, `invalid_config`, `provider_error`, `invalid_response`, `budget_exhausted`); `invalid_config` never retried. Quota/rate-limit signals are checked **before** credential signals, and bare `401`/`403` digits inside a message are no longer treated as an HTTP status | Server started with `GOOGLE_API_KEY=invalid-key`: `503 ai_not_configured` in **975 ms**, `retryable: false`. Regression tests: a quota failure returned as HTTP 403 → `rate_limit` (retryable); explicit `PERMISSION_DENIED` → `invalid_config`; a message containing `40123` → `provider_error`. |
| 1.4 | `503` told the user nothing actionable | Error body now carries `detail`, `code`, `retryable`, `request_id`; each message says the manuscript is preserved and whether retry helps | Live responses captured for 503/504/400 (`invalid_citation_style`). |
| 1.5 | Health reported `status ok` + `ai_engine_ready true` while analysis failed | `/health` and `/api/health` share `buildHealthPayload`: `status` is liveness; `provider_readiness.state` is `unverified` from key presence alone; `?probe=1` runs a real cached provider call. `ai_engine_ready` is true only after a successful probe | `GET /api/health` → `ai_engine_ready:false`, `state:"unverified"`, detail explains how to probe. `?probe=1` → `state:"ready"` in **1.9s** with `gemini-3.1-flash-lite`. An earlier probe passed a 6s SDK deadline, which the provider rejects (10s minimum) and which was misreported as a timeout; the probe now relies on the client-side race instead. |
| 1.6 | Fabricated/stalled 65% progress | Client progress is an indeterminate bar with elapsed seconds and no `aria-valuenow`; stage list is descriptive, not a fake percentage. `Topbar.tsx`, `useAudit.ts`, `globals.css` | Browser: during a live audit the progressbar exposed `Audit in progress for N seconds`; no percentage rendered. |
| 1.7 | Duplicate submissions possible from button + keyboard shortcut | `runningRef` guard in `useAudit`; button disabled while running; shortcut routes through the same guarded function | Unit test: one provider call for one click + Ctrl+Enter + two more clicks. Browser: single audit request per run. |
| 1.8 | No request IDs or sanitized stage timing logs | `src/lib/ai/log.ts`; one JSON line per stage with request id, status, duration; request summary with character counts only. Never logs text, prompts, output, or keys | Server logs captured: `analysis_stage` entries and `analysis_failed` with `error_kind` only. |
| 1.9 | Partial verification could look complete | Pipeline returns per-stage `checks` (`completed`/`unavailable`/`skipped` + reason + duration) and `status: completed|partial`; **any** reference that could not be verified marks the verification check `unavailable` (with an “N of M” message), and the reference entry carries `verification_unavailable` with "unverified, not confirmed correct" copy | Live response: all six checks `completed` with durations; pipeline tests cover a failing Crossref/OpenAlex/retraction check each → `partial` + verification `unavailable`; PDF report renders the checks table and unverified count. |
| 1.10 | Configured `chicago17` was rejected by the server (`400`) | Server and client share canonical style keys; `normalizeCitationStyle` maps `chicago17` → `chicago-author-date` | Live: `citation_style=chicago17` returned 200 with `citation_style: "chicago-author-date"`. |

## 2. Document and audit state

| # | Finding | Fix | Verification |
|---|---|---|---|
| 2.1 | “Nothing flagged” shown before any audit | `src/lib/auditState.ts` models `empty/ready/running/completed/stale/failed`; “Nothing flagged” renders only for a current, fully completed audit with zero findings | Unit tests; browser showed “Ready to audit” before the first run and “Audit completed” after. |
| 2.2 | Failed/partial audits could read as clean | Partial audit shows “Audit completed with unavailable checks”, lists incomplete checks, and states missing findings are not clean. Finding counts are qualified (“N open findings so far … detected by completed checks”), and a category whose check did not run shows “— / not checked” instead of a misleading zero | Widget unit tests with unavailable verification, citation, style, and reference checks; PDF report states `PARTIAL`. |
| 2.3 | Stale results not marked after edits/style/mode changes | Result stores revision + style + mode; any change marks it stale with a warning banner and editor notice | Browser: appending text changed the banner to “Edited since this audit”. Unit tests cover text/style/mode. |
| 2.4 | An in-flight response could attach to a replacement document | Results are applied only when request id + revision + style + mode match; document change clears the run | Unit test (reducer) + dashboard test (clear during in-flight request) — replacement document stayed “Ready to audit”. |
| 2.5 | First character replaced the textarea (focus/state loss) | Input surface is controlled by the dashboard and stays mounted while typing; the editor is shown alongside/below, and only an explicit action hides the input. `InputArea` is controlled, no local copy | Unit test types character-by-character and asserts the same DOM node persists; browser `fill` retained focus. |
| 2.6 | Switching panels lost accepted fixes/dismissals | Editor panel stays mounted and is hidden with `hidden` when another panel is active | Dashboard test: audit → edit → Export → Editor; text and results preserved. |
| 2.7 | Clearing destroyed work without confirmation | Shared confirm dialog before clearing a document; reset also confirms | Unit test for reset-to-audited-text; component code for clear confirmation. |
| 2.8 | History could attach saved findings to the wrong document | Save embeds `manuscript_text` in `results`; loading restores text + style + mode and adopts the result for that revision. Legacy rows without text show a read-only notice instead of merging with the open document | Dashboard test loads a saved audit and asserts restored text/style/mode; legacy branch renders explicit notice. |
| 2.9 | Typing one character reset the “Reset” target | `useRealtimeDocumentEditor` distinguishes the editor's own emitted text from an external replacement | Workspace test: accept a fix, confirm reset, final text equals the original audited manuscript. |

## 3. Accessibility

| # | Finding | Fix | Verification |
|---|---|---|---|
| 3.1 | Clickable upload `div` with no keyboard semantics | Real `<button>` opens the hidden file input (input removed from tab order and a11y tree); drag-and-drop retained | Unit test activates the button and asserts `input.click()`. |
| 3.2 | Textarea had no accessible label | Persistent `<label>` + `aria-describedby` instructions and live character counter | Browser a11y snapshot: `textbox "Paste manuscript text or a reference list"`. |
| 3.3 | History cards not keyboard-activatable | Cards are articles with explicit “Load report” buttons and separate delete buttons (no nested interactive controls) | History test activates “Load audit report for Saved Paper”. |
| 3.4 | Finding selectors were non-semantic divs with nested buttons | `<ul>/<li>` with a selection button and a sibling “Apply fix” button; `aria-expanded` | Browser snapshot shows each finding as a button plus a separate labelled apply button. |
| 3.5 | Audit mode had no selection semantics | Group with `aria-pressed` on both buttons; active mode also stated in the mobile settings summary | Browser snapshot; dashboard test asserts `aria-pressed`. |
| 3.6 | No dashboard h1, heading order, or skip link | Visually-hidden h1, “Skip to main content” link, `main` landmark, panel headings h2, widget headings h3 | Browser snapshot and focus test. |
| 3.7 | Icon-only controls lacked names | Added/verified names for navigation menu (with `aria-expanded`/`aria-controls`), clear document, close, delete, apply-fix, account menu | Browser snapshot lists names for each. |
| 3.8 | Error/auth/subscription/drawer overlays did not manage focus | Shared `Modal` (portal, focus in, Tab trap, Escape, focus restore, `inert` app shell, scroll lock, labelled dialog); drawer implements the same pattern over the dashboard main region | Browser: auth dialog focused `#auth-email`; 12 Tab presses stayed inside; Escape restored focus to “Sign In”. Drawer: focus on “Close navigation”, main `inert`, `aria-expanded=true`; Escape restored the trigger and cleared `inert`. |
| 3.9 | No reduced-motion handling | Global `prefers-reduced-motion` rule plus `motion-reduce:` on spinners/skeletons; indeterminate bar stops animating | Browser emulation: transition became `1e-05s`, scroll behavior `auto`, media query matched. |
| 3.10 | Low-contrast text, placeholders and control borders | `#948a76` (3.41:1) → `#6b6152` (6.07:1); placeholders now 6.07:1; warning text `#93650f` (4.06:1 on tint) → `#7a530c` (5.43:1); control borders `#8f836c` (3.73:1) | Contrast ratios computed from WCAG relative luminance; new tokens asserted by the design-token test. |
| 3.11 | Feedback not announced | Status banner `role=status` (single live region), validation errors `role=alert`, export outcomes `aria-live`, findings headline `aria-live` | Live audit transition announced “Audit completed”; browser DOM inspection. |
| 3.12 | Target sizes | Primary controls raised to `min-h-11` (44px) or `min-h-10` with 44px icon buttons | CSS inspection; mobile screenshot. |

## 4. Workflow, exports and copy

| # | Finding | Fix | Verification |
|---|---|---|---|
| 4.1 | Mobile header crowded | Document identity + primary audit action stay visible; mode/style move behind a labelled “Audit settings” disclosure that shows the active style | Browser 390px screenshot and snapshot; no horizontal overflow. |
| 4.2 | Limits and formats not explained | Input area states `DOCX, PDF, TXT, RTF, or BibTeX`, 10 MB / 200,000 characters before submission; character counter | Unit test asserts the copy; browser snapshot. |
| 4.3 | Unsupported/oversized/empty/corrupt files failed silently | Client validates extension, size, empty file with `role=alert`; server returns `415 unsupported_file`, `413 file_too_large`, `422 unparseable_file`, `400 corrupt_file`, `400 empty_file`; DOCX read failures surface in the UI | Unit tests for client validation; server codes implemented and type-checked; live 400/503 captured. |
| 4.4 | Advertised RTF/BIB not parsed | `rtfToPlainText` and `bibtexToPlainText` added to `document-parser.ts` | Unit tests for RTF groups/paragraphs/escapes and BibTeX fields. |
| 4.5 | Ambiguous source precedence | Selecting a file clears pasted text and typing clears the file; the UI states exactly what will be analysed | Controlled `InputArea` + dashboard handlers. |
| 4.6 | Export panels disagreed | `ExportPanel` renders the same `DocumentExportSuite` as the editor. Before an audit, annotated/PDF exports are disabled with an explanation; when the manuscript or settings changed after the audit, evidence exports are blocked with a re-run reason, while the plain manuscript export (“No findings”) stays available | Unit tests for enabled/disabled/no-audit/stale states; browser Export panel shows the stale-revision explanation. |
| 4.7 | Exported files unverified | Clean DOCX, annotated DOCX, and PDF are generated and re-parsed in tests: current text (incl. accepted fix), style annotation, audit context, checks table, unverified warning, and non-Latin text handling | `src/lib/ai/__tests__/export.test.ts` (4 tests, passing). |
| 4.8 | History had no failure/retry state | Loading, empty, error + “Try again”, and signed-out states; delete uses an accessible confirm dialog; delete failures announced | Code review + `HistoryPanel` test (load). |
| 4.9 | Product copy overstated capabilities | Removed: “real time”, “any length”, “50 MB”, “3 audits/day”, “5,000 words”, “unlimited words”, “priority processing”, “sessionless / never store”, “9 styles”, “Retraction Database”. Corrected limits, styles, privacy/save behaviour, institutional framing; institutional CTAs now open email | `copy-accuracy.test.tsx` (6 tests) fails if the old claims return. |
| 4.10 | Unused `SubscriptionModal` parameter warning | `handleSuccess` no longer declares an unused parameter | `npm run lint` → clean (0 problems). |
| 4.11 | Deprecated middleware convention | `src/middleware.ts` → `src/proxy.ts` with `export async function proxy`; Supabase session refresh unchanged | `npm run build` lists `ƒ Proxy (Middleware)` with no deprecation warning. |

## 5. Verification summary

Commands (from `citepilot-web/`):

- `npm test` — **242 passed / 26 files** (was 172/18). New suites: audit state, input limits, reliability, pipeline completeness, export artifacts, dashboard workflow, accessibility, copy accuracy.
- `npm run typecheck` — clean.
- `npm run lint` — **0 problems** (was 1 warning + new rules).
- `npm run build` — compiled successfully; 18 routes; proxy recognized.
- Real API: `POST /api/v1/analyse` with `gemini-3.1-flash-lite` → `200`, `status: completed`, 19.1s and 26.8s on two runs, 2 citations matched, 2 references verified, all six checks completed with durations.
- Provider readiness: `?probe=1` → `ready` in 1.9s; `ai_engine_ready=true`.
- Bounded failures: `503 ai_not_configured` in 975ms (invalid key, no retries); `504 provider_timeout` in 983ms (budget exhaustion).
- Browser (Playwright, 390×844 and 1280×900): 0 console errors, no horizontal overflow, keyboard-only modal/drawer focus containment and restore, reduced-motion emulation, stale-state transition, export availability.

## 6. Not verified here (requires user-provided access)

These are release gates in CP-REMEDIATION-001 that cannot be closed from this environment:

1. **Deployed preview journey.** No Vercel credentials/project link were available. Run the manuscript → results → export journey on a preview, and record the previous deployment + rollback procedure.
2. **Production environment variables.** Confirm the deployed project uses `GEMINI_MODEL=gemini-3.1-flash-lite` (or another model verified with a timed minimal call) and a valid `GOOGLE_API_KEY`. Repo default and `.env.example` are updated; the Vercel project values must be checked.
3. **Screen-reader pass.** Automated a11y-tree inspection and keyboard tests passed; a real NVDA/VoiceOver pass is still required.
4. **Authentication and subscription with test accounts.** Sign-in/return flow, history ownership, and sandbox PayPal activation were not exercised (no test accounts/sandbox credentials).
5. **Live file-upload journey.** Client-side validation and parsers are tested; a real DOCX/PDF upload through the deployed UI was not performed in this session.

## 7. Mock removal and production hardening — 2026-11-15

### 7.1 Mocks removed (no fallback left behind)

| Mock | Where | Replacement |
|---|---|---|
| `https://mock-project.supabase.co` / `mock-anon-key` defaults | `lib/supabase/config.ts` | `isSupabaseConfigured`; `createClient()` returns `null`, server client throws `SUPABASE_NOT_CONFIGURED_MESSAGE`, middleware skips session refresh |
| Fabricated testimonials (Dr. Amara Osei, Prof. Elena Marchetti, Dr. James Okafor) | `components/landing/Testimonials.tsx` | Component deleted; section removed from `LandingView` and the landing barrel |
| Hardcoded PayPal plan ID `P-00697875…` and client ID | `PayPalSubscriptionButton.tsx` | Read from `NEXT_PUBLIC_PAYPAL_PLAN_ID` / `NEXT_PUBLIC_PAYPAL_CLIENT_ID`; unconfigured renders "checkout is not configured" |
| "Dev mode" activation grant (`valid: true` without PayPal) | `api/subscription/activate/route.ts` | 503 when credentials are absent; activation only after PayPal reports `ACTIVE` for the sold plan |
| Unsigned webhook path (`NODE_ENV !== production`) | `api/webhooks/paypal/route.ts` | Signature verification always required; missing `PAYPAL_WEBHOOK_ID` → 503 |
| Client-only paywall (1,500-word free limit) | `lib/gating.ts` used only in the browser | `lib/ai/entitlement.ts` + 403 `word_limit_exceeded` in `/api/v1/analyse` |
| Tier read from client-writable auth metadata | `AuthContext.tsx` fallback profile | Always `free`; paid tiers come from the profile row and a live subscription |

### 7.2 Correctness fixes found while validating the demo manuscript

| Defect | Symptom | Fix |
|---|---|---|
| Crossref/OpenAlex accepted their top search hit | A fabricated reference was reported as "discrepancies found" against an unrelated paper | `titlesRelated` gate in both providers; no title match → `not_found` |
| Crossref 429 on burst searches | Audit flipped to `partial` on one throttled request | Bounded retries with `Retry-After`; Crossref fan-out capped at 3 |
| OpenAlex 404 treated as an outage | Legitimate "no record" marked the whole audit `partial` | 404 → `not_found` |
| Matching/style/references stages serialized after citations | 45s budget consumed before later checks ran | Independent stages run concurrently |
| One hung model call consumed the whole budget | `references=unavailable(45015ms)`, everything else skipped | 28s per-stage deadline, one bounded retry, global LLM concurrency 2 |
| Timeout retried inside the client | Two 20s attempts per stage | Timeouts are terminal for the stage; transient 5xx/429 still retried |
| Style/matching prompts carried up to 60–80KB of pretty-printed JSON | Style timed out at ~20s on ordinary manuscripts | Compact digests (8–20KB) with only the fields under review |
| `PAYMENT.SALE.COMPLETED` used the sale ID as the subscription ID | Phantom subscription rows on renewal | Uses `billing_agreement_id` |
| Invented 30-day billing period | `current_period_end` did not match PayPal | Stored from `next_billing_time`, else null |
| Cancellation revoked access immediately | Paid customer lost access mid-period | Tier retained until `current_period_end`; expiry applied lazily |
| Checkout reported "Subscription Active!" regardless of activation | Paying user could be told they had access when the server refused | Button awaits the activation response and shows the failure |
| API key compared with `!==` | Timing side channel | `timingSafeEqual` |
| Rate limiter was per serverless instance | A caller could exceed the limit by N on N instances | Migration `016` adds an atomic `consume_rate_limit` RPC (service-role only); the per-instance window remains only as a logged degradation |
| A retried stage could consume two full provider windows | One reference-parsing call took 52s and starved style/matching | One bounded window per stage (28s, no retry); timeout is terminal |
| `LLM_CONCURRENCY=2` made the third parallel stage wait out its window | One extraction stage timed out in every run | Gate default 3, matching the number of stages that start together |
| A timed-out matching stage still labelled every citation `no_match` and every reference `orphaned` | A check that never ran produced definitive findings | `unchecked` status when matching did not complete |
| OpenAlex compared only the publication year | A title/journal/volume/page mismatch passed as `verified` | Same field comparisons as Crossref (title, year, DOI, journal, volume, pages), sharing `titlesMatch`/`journalsMatch`/`volumesMatch`/`pagesMatch` |
| OpenAlex returned `{}` when Crossref had already verified a reference | An empty object was indistinguishable from a real provider result | Explicit `status: "not_consulted"` with the reason; `openalex_validation` always states its outcome |
| Title matching accepted containment anywhere in the string | Bishop 2006 was "discrepancies found" against an unrelated conference paper whose title happens to contain the book's words | The shorter title must be a *prefix* of the longer one (subtitle/edition extension only) |
| OpenAlex free-text `search` ranked a book review above the book | A real, citable book (Bishop 2006, no DOI) came back `not_found` | `filter=title.search`, which returns the work itself |
| A derivative OpenAlex record stood in for the work | The book verified against the Kybernetes *review* (2007, vol 36, p 275), so its own metadata would have produced false journal/volume/page discrepancies | Candidate types `book-review`, `paratext`, `erratum`, `peer-review`, `retraction`, `supplementary-materials` are skipped |
| Every reference carried `retraction_info`, and the editor treated its presence as a retraction | Every clean reference rendered "Retracted Academic Paper Detected" with `fixType: replace` | Only `status: "retracted"` or `is_retracted: true` is a retraction; `normal` produces no finding |
| An unconfirmed retraction check produced no finding at all | Sources whose status could not be checked were silently absent, so a clean-looking report implied they were fine | `unknown` results carry the reason, `action_required: true`, and manual-verification guidance; the editor shows it at medium severity and the PDF lists those sources with the required action |
| A reference verified by the fallback provider kept Crossref's `not_found` | Bishop 2006 was counted in "metadata could not be verified" and the editor said "Reference not found in Crossref" even though OpenAlex had verified it | Promotion now copies the fallback's `status` and `provider`, so totals and findings reflect the provider that actually answered |
| OpenLibrary was imported and queried but not wired into the result type or call site | The tree did not typecheck; book-only references had no third fallback | Return type and call site include `openlibraryResults`; `provider` added to `CrossrefValidation` |

### 7.3 Verification for this pass

- Demo manuscript `samples/citepilot-error-demo.txt`: **six consecutive `completed` audits**, 6/6 checks, 9.8s–42.5s, identical finding set.
- Findings returned: 2 unmatched citations, 1 year mismatch, 1 spelling mismatch, 1 retracted reference (Mehra et al. 2020), 1 orphaned reference (Bishop 2006), Crossref discrepancies for 2 entries (author/journal/pages/title), 4 style warnings, 3 uncited statistical claims, recency 16.7% within 5 years.
- Fabricated entries (`Doe 2020`, `Nguyen & Park 2023`) now report `not_found` from both providers instead of inheriting unrelated metadata.
- Provider verification proved against the live APIs (demo manuscript plus targeted probes):
  - Tampered LeCun entry (wrong title/journal/volume/pages, real DOI) → Crossref `discrepancies_found` with 4 discrepancies, each quoting Crossref's actual record (*Deep learning*, *Nature*, 521, 436–444).
  - Fabricated Doe 2020 → `not_found` from both Crossref and OpenAlex.
  - Bishop 2006 (book, no DOI) → Crossref `not_found`, OpenAlex `verified` against the Springer 2006 book record; retraction reported as `unknown`, not as a clean bill of health.
  - Every reference Crossref verified → OpenAlex `not_consulted` with the reason, so no response implies a second opinion that did not happen.
- Free-tier enforcement: 1,608-word request → `403 word_limit_exceeded`.
- Billing: 9 route tests (`src/app/api/__tests__/billing.test.ts`) cover fail-closed activation and signature-required webhooks.
- Rate limiting: 7 tests (`src/lib/ai/__tests__/rate-limit.test.ts`) cover the shared counter, `Retry-After`, and the logged degradation path.
- `npm test` — **296 passed / 33 files**; `npm run typecheck` clean; `npm run lint` clean.

### 7.4 Deployed preview and provider rate limits - 2026-11-18

- **Vercel project re-linked** to `echelnet/citepilot` (the previous link pointed at an organisation the CLI could not access). Root Directory is `citepilot-web`, so deployments must start from the repo root. **Production is `https://citepilot-web.vercel.app`** — the project's production alias, despite the project being named `citepilot`.
- **The live production build was stale and misconfigured.** Before this pass `citepilot-web.vercel.app` ran an old build with `GEMINI_MODEL=gemini-3.8-flash` (the model that never answered within 90s). After setting `OPENALEX_API_KEY` and redeploying: `/api/health?probe=1` reports `ai_engine_ready: true` on `gemini-3.1-flash-lite`, the demo audit is `completed` with 6/6 checks in 11.9s, and the PDF export returns 200.
- `GEMINI_MODEL` in Vercel was `gemini-3.8-flash` — the model that failed to answer within 90s on 2026-11-14. Replaced with `gemini-3.1-flash-lite` in Production, Preview and Development.
- **Defect: one unavailable lookup marked the whole stage `unavailable`.** The first preview audit verified 5 of 6 references; the sixth OpenAlex lookup returned HTTP 429, and the verification stage — plus every UI surface — reported "unavailable", which reads as "verification never ran". A new `partial` check status now distinguishes incomplete coverage from a failed check, and the summary says "incomplete coverage" instead of "could not complete".
- **Root cause of the 429:** OpenAlex removed the `mailto` polite pool in February 2026 and now needs a free API key; keyless traffic is counted per egress IP, and Vercel's is shared. Fixes: send `OPENALEX_API_KEY` when configured, cap OpenAlex/OpenLibrary/retraction fan-out at 3, surface 429 as "rate-limited … unverified, not confirmed correct", stop retrying a spent daily budget, and redact `api_key` from every surfaced error. The key is now set in all three Vercel environments (task 3.8), and the production audit verified Bishop 2006 through OpenAlex with no rate limit.
- The reference-level finding for a `not_found` reference now names the fallback provider that could not be checked and carries its fix guidance, so the author knows the negative is not final.
- **Batching was bounded.** The citation stage had been switched to 4-paragraph chunks at concurrency 2, which improved recall on the demo but would queue 60 provider calls for a 240-paragraph paper inside one 28s window. Chunk size now grows to keep the stage at ≤12 calls, and reference parsing (≤8 calls) also handles bibliographies that use one entry per line with no blank lines — previously the whole list went to a single call. `batching.test.ts` asserts the call caps and that every paragraph/line is still sent exactly once.

### 7.5 Still open

The production env values (Supabase, PayPal, `OPENALEX_API_KEY`), a production promotion, a real screen-reader pass, an interactive accept/dismiss round-trip, history save/restore with a test account, and a sandbox PayPal journey still require access this environment does not have. Every one of them needs credentials or a browser session rather than code.
