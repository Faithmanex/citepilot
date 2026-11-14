# CitePilot — Functionality, Usability, and Accessibility Remediation Plan

Document ID: CP-REMEDIATION-001
Version: 1.0
Last Updated: 2026-11-14
Status: Implemented — local verification complete; deployment and account verification pending

## Objective and scope

Restore reliable citation analysis, ensure that results accurately represent what was checked, remove accessibility barriers, and make the manuscript-to-export workflow consistent across desktop and mobile.

This plan follows the local platform audit. The audit exercised manuscript entry, an actual analysis request, error handling, mobile navigation, and the landing-page interactive example. It also inspected source and ran engineering checks. Production behavior, authenticated history, payments, successful analysis results, and generated exports require additional verification. An observed local failure is not proof of a production-wide outage.

No implementation or deployment changes are included in creating this plan.

## Audit baseline

- A short analysis request returned HTTP 503 after approximately 58 seconds; Gemini reported DEADLINE_EXCEEDED.
- The health endpoint simultaneously reported status ok and ai_engine_ready true.
- Before analysis ran, the editor displayed “Nothing flagged” and “This run found no citation or reference problems.”
- Character-by-character entry appeared to transition away from the initial textarea after the first character; complete paste succeeded. Reproduce this as a normal typing workflow before fixing.
- The upload target was a clickable div without keyboard semantics; the textarea lacked an accessible label.
- Error-dialog and mobile-drawer opening did not move focus into the overlay.
- Analysis progress remained at 65% for most of the request.
- Additional source findings included inaccessible history-card activation, missing audit-mode selection semantics, silent unsupported-file rejection, and missing reduced-motion overrides.
- Desktop and 390-pixel mobile layouts remained usable in inspected views. Manuscript text survived the failed analysis.
- Existing verification passed: 172 tests across 18 files, TypeScript, and production build. ESLint reported one unused-parameter warning. Next.js reported the deprecated middleware convention.

## Delivery sequence

| Phase | Priority | Outcome | Dependency |
| --- | --- | --- | --- |
| 1. Analysis reliability | P0 | Analysis succeeds or fails within a bounded time with recovery | Configuration and provider diagnosis |
| 2. Document and audit state | P0/P1 | Users can distinguish unrun, failed, stale, partial, and completed audits | Coordinate with phase 1 response contract |
| 3. Accessibility | P1 | Complete keyboard and assistive-technology workflows | Shared overlay and control patterns |
| 4. Workflow consistency | P1/P2 | Clear input, mobile, history, account, and export journeys | Reliable state model |
| 5. Regression and release | P1 | Verified implementation and deployment | All preceding phases |

Use focused changes for each phase. Begin each implementation change by inspecting the working tree and preserving unrelated user changes. Review current source before relying on audit-time line numbers or assumptions.

## Phase 1 — Make analysis reliable and failures recoverable

### Investigation

1. Inspect model configuration, request payloads, provider timeout settings, retry policy, and pipeline deadlines.
2. Verify that the configured model is available to the configured account before changing models.
3. Run a minimal provider request, then the same short manuscript through the complete pipeline.
4. Measure extraction, matching, verification, and response serialization separately.
5. Determine whether the failure is transient, model-specific, configuration-related, or caused by request construction or deadline handling.

### Implementation

- Bound each provider call by the remaining overall request budget, leaving time to serialize an actionable response.
- Retry transient errors only when sufficient budget remains. Do not repeatedly retry invalid credentials or invalid configuration.
- Distinguish provider timeout, rate limit, invalid configuration, and service failure internally.
- Return useful user-facing errors that explain what failed, confirm manuscript preservation, and indicate whether retry is appropriate.
- Replace fabricated or stalled percentages with honest stage-based indeterminate progress unless measurable progress exists.
- Prevent duplicate submissions from buttons and keyboard shortcuts.
- Separate basic liveness from provider readiness. A configured key alone must not imply a successful provider connection. Use a cached readiness check or clearly identify configuration-only information.
- Add request IDs and sanitized stage timing logs without logging manuscript content or credentials.
- Preserve partial verification information when available and clearly mark checks that could not complete.

### Acceptance criteria

- A short manuscript completes successfully through the real API.
- Simulated timeouts and provider failures return within the request budget.
- Failed requests preserve the manuscript and provide a working retry path.
- Repeated clicks or keyboard shortcuts do not create duplicate analysis requests.
- Health/readiness reporting communicates its actual guarantee.

### Primary code areas

`citepilot-web/src/lib/ai/config.ts`, `llm.ts`, `pipeline.ts`, `citation-extractor.ts`; `src/app/api/v1/analyse/route.ts`; health routes; `src/lib/useAudit.ts`; dashboard progress and error UI.

## Phase 2 — Correct document and audit state

Introduce explicit states: empty, ready to audit, running, completed, edited since audit, and failed. Represent partial or unavailable checks within results separately from verified findings.

### Implementation

- Display “Ready to audit” before the first successful analysis.
- Reserve “Nothing flagged” for a completed audit with zero findings and disclose incomplete checks.
- Keep the last successful result identifiable after a failed retry; do not relabel it as current.
- Mark results stale when text, citation style, or audit mode changes.
- Associate every request and result with a document revision and audit settings.
- Prevent an older request from attaching results to a replacement document.
- Clear or replace associated analysis state when loading a different document.
- Reproduce the first-character input transition and keep the initial textarea mounted during typing. Use an explicit transition into the editor where appropriate.
- Preserve draft edits when switching panels.
- Define clear and reset behavior with confirmation or undo when substantive work would be lost.
- Ensure exports use the current revised manuscript and clearly identify any mismatch with the last audited revision.

### Acceptance criteria

- Unrun, failed, partial, and stale analyses cannot be mistaken for a clean audit.
- Character-by-character typing and multiline paste both retain all input.
- Document replacement during an in-flight request does not corrupt the new document or its results.
- Switching panels preserves the draft and accepted changes.
- Re-auditing and exporting use the intended document revision.

### Primary code areas

DashboardView, InputArea, ManuscriptEditorWorkspace, RigorScoreWidget, LiveSuggestionFeed, editor state hooks, useAudit, ExportPanel, and DocumentExportSuite.

## Phase 3 — Fix accessibility across the workspace

### Controls and structure

- Replace the clickable upload div with a keyboard-operable file control using a real button or correctly associated label.
- Add a persistent textarea label and associated input instructions.
- Give history cards and finding selectors proper button/link semantics; avoid nested interactive controls.
- Expose audit mode through radio or pressed-button semantics.
- Add a dashboard h1 and skip-to-content link; review heading order and landmarks.
- Ensure icon-only controls have accurate accessible names.

### Dialogs and navigation

Create a shared accessible overlay pattern for error, auth, subscription, and mobile navigation overlays:

- Move focus to an appropriate heading or first control on open.
- Keep keyboard focus within the active modal.
- Support Escape dismissal where appropriate.
- Restore focus to the initiating control on close.
- Make background content inert while the overlay is modal.
- Prevent background scrolling.
- Provide accessible dialog names and descriptions.
- Expose mobile navigation expansion state on its trigger.

### Feedback and visual access

- Announce analysis stages, validation errors, export outcomes, and meaningful result changes without excessive repeated announcements.
- Respect reduced-motion preferences for skeletons, pulses, and transitions.
- Measure text, placeholder, control-border, and focus-indicator contrast and fix measured failures.
- Check target sizes, focus visibility, zoom, and narrow-width reflow.

### Acceptance criteria

- Upload, edit, analyze, review findings, load history, and export using only a keyboard.
- Screen-reader checks convey names, roles, selected states, errors, progress, and outcomes correctly.
- Modal focus cannot move into background controls and returns appropriately on dismissal.
- Zoom and reduced-motion settings preserve usable interactions.

## Phase 4 — Improve workflow clarity and consistency

### Input and mobile experience

- Simplify the mobile header while retaining a clear document identity and primary audit action.
- Group secondary settings without hiding the active style and mode context.
- Explain supported formats, file-size limits, and text limits before submission.
- Provide visible, accessible feedback for unsupported, oversized, empty, corrupt, and unparseable files.
- Align advertised formats with actual parser support, including RTF and BIB.
- Ensure replacement controls distinguish the selected file from pasted text and explain which source will be analyzed.

### Exports

- Align availability and behavior between the editor export suite and Export panel.
- Explain why diagnostic exports are unavailable before a successful audit.
- Distinguish a plain manuscript export from an export containing audit evidence.
- Verify that clean DOCX reflects accepted changes and current text.
- Verify that annotated DOCX implements the annotations or tracked changes its UI promises.
- Verify that PDF reports accurately represent findings, unavailable checks, and analysis context.
- Inspect generated files for readability and content completeness.

### History, authentication, and subscription

- Provide meaningful history loading, empty, failure, and retry states.
- Verify history loading preserves the correct document, style, mode, and results.
- Verify sign-in and return-to-workspace behavior with an authorized test account.
- Verify subscription activation and plan restrictions with sandbox payment facilities.
- Check consistency of client restrictions and server enforcement.
- Do not use real charges or destructive account operations for routine verification.

### Product claims

Review landing-page and pricing statements against implemented behavior, including “real time,” “any length,” supported formats, privacy statements, institutional capabilities, and plan/export limits. Confirm evidence for claims before retaining them; revise unsupported promises.

### Acceptance criteria

- Actions have understandable outcomes and actionable failure states.
- Advertised capabilities, plan restrictions, dashboard behavior, and downloaded files agree.
- Mobile controls remain readable and operable without horizontal overflow.

## Phase 5 — Regression coverage and release verification

Add behavior-focused coverage for gaps exposed by the audit rather than tests that only assert implementation details.

| Area | Required scenarios |
| --- | --- |
| Input | Character-by-character typing, multiline paste, supported formats, invalid/empty/oversized files |
| Audit state | Never run, success, zero findings, partial checks, failure, stale results |
| Request lifecycle | Duplicate submit, timeout, retry, replacement during analysis |
| Editing | Accepted fixes, manual edits, reset, panel switching, re-audit |
| Accessibility | Keyboard upload, modal and drawer focus, selected modes, announcements |
| Exports | Availability, correct revision, readable files, truthful annotations |
| Accounts | Sign-in recovery, history ownership, history loading, plan enforcement |

### Verification sequence

1. Run targeted tests as each behavior changes.
2. Run automated accessibility checks and manual keyboard and screen-reader checks.
3. Inspect desktop, tablet, mobile, and zoomed layouts.
4. Run lint, type checking, the regression suite, and a production build.
5. Exercise the full manuscript-to-results-to-export journey on a deployed preview.
6. Verify controlled provider-failure and retry paths on the deployment target.
7. Record outcomes and unresolved limitations before release.

### Maintenance and deployment

- Resolve the unused SubscriptionModal parameter warning.
- Migrate the deprecated middleware convention to proxy in a separate focused change, verifying authentication and route behavior.
- Follow LEARNING.md and current project instructions when deploying.
- If diagnosis establishes missing or incorrect environment variables, correct them without exposing secrets and redeploy immediately.
- Run Vercel production deployment from the monorepo root because the project Root Directory is citepilot-web/.
- Preserve an identified previous deployment for rollback; verify rollback procedures before release.

## Release gates

- Core analysis succeeds on the deployment target with a known test manuscript.
- All high-priority findings are resolved and verified.
- No failed, stale, partial, or unrun analysis is presented as clean.
- Key workflows are keyboard accessible and manually checked with a screen reader.
- Generated DOCX and PDF artifacts have been opened and inspected.
- Authentication, history, and plan enforcement have been verified with suitable test accounts.
- Failure paths preserve user work and provide recovery.
- Required engineering checks pass and remaining limitations are documented.

## Deliverables and completion tracking

- [x] Analysis root-cause diagnosis and bounded failure handling
- [x] Explicit document/audit state model
- [x] Stable typing, replacement, editing, and re-audit behavior
- [x] Accessible controls, overlays, navigation, and announcements
- [x] Responsive header and actionable file-validation feedback
- [x] Consistent and verified exports
- [ ] Verified account, history, and subscription workflows (history covered by tests; sign-in and PayPal need test accounts)
- [x] Product-copy reconciliation with actual capabilities
- [x] Regression tests and manual accessibility evidence (keyboard + a11y tree; screen-reader pass outstanding)
- [ ] Preview/deployment verification and rollback reference (requires Vercel access)
- [x] Final findings register linking each issue to its fix and verification result — see `AUDIT-FINDINGS-REGISTER.md`

Implementation should begin with phases 1 and 2 because reliable processing and truthful results determine whether users can trust the platform. Accessibility work should use shared patterns so the same correction applies consistently across the product.

## Verification record (2026-11-14)

Root cause of the P0 failure: the default model `gemini-3.8-flash` is listed for the account but never returned (still hanging after 90s). `gemini-2.5-flash` answered in 1.8s; the default and `.env.example` now use it. A short manuscript through the real pipeline returns `200` in ~20s with all six checks completed. Bounded failures return in under 1s (`503 ai_not_configured`, no retries; `504 provider_timeout`), and health only reports readiness after a real probe.

Local evidence:

- `npm test`: 228 passed across 25 files.
- `npm run typecheck`: clean.
- `npm run lint`: 0 problems.
- `npm run build`: success; routes include `/api/health`, `/api/v1/analyse`, exports; `ƒ Proxy (Middleware)`.
- Browser checks at 390×844 and 1280×900: no console errors, no horizontal overflow, keyboard focus containment/restore for modal and drawer, reduced-motion emulation, stale-state transition, export availability.
- Generated DOCX/PDF artifacts re-parsed and inspected for content and truthfulness.

Still open (needs user-provided access): deployed-preview journey and rollback reference, production env confirmation, real screen-reader pass, sign-in/history ownership with a test account, sandbox PayPal activation, and an uploaded-file journey through the deployed UI. Details: `AUDIT-FINDINGS-REGISTER.md` §6.
