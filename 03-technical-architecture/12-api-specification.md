# 12 — API Specification

> **Document ID:** CP-ARCH-012
> **Version:** 1.2.0
> **Last Updated:** 2026-10-12
> **Status:** Approved
> **Owner:** Engineering — API Team
> **Classification:** Internal

---

## 1. Overview

This document specifies the CitePilot HTTP API. The MVP is **sessionless and synchronous**: the whole API (analysis, export, health, audits, subscriptions, webhooks) is served by **co-located Next.js Route Handlers** inside `citepilot-web` — there is no separate backend service, gateway, or CORS hop. Audit history rows are recorded via `POST /api/audits/save` (Supabase).

> **Revision note:** This v1.2.0 supersedes the previous design (accounts, JWT auth, document/results CRUD, `202 Accepted` job polling, S3, Stripe, and the retired Python FastAPI service + Express gateway). Those concepts were removed with the synchronous, sessionless MVP (ADR-009/010/011) and the Node co-location. The executable contract lives in `citepilot-web/src/app/api/**/route.ts`, `citepilot-web/src/lib/ai/*.ts`, and `citepilot-web/src/lib/api.ts` — when code and this document disagree, code wins.

---

## 2. Conventions

- **Base URL**: `/api/v1`. In production the frontend calls `NEXT_PUBLIC_API_URL` when set; unset, it calls same-origin `/api/v1` served by the same Next.js app. Local dev default: `http://localhost:3000/api/v1`.
- **Transport**: HTTPS in production; JSON request/response bodies except where noted; uploads use `multipart/form-data`.
- **Errors**: JSON body `{"detail": "<message>"}` — the frontend reads `detail` then `message`. Status codes: `400` (bad request), `401` (bad API key, only when `API_KEY` is set), `413` (over size caps), `429` (rate limit), `503` (Gemini unavailable), `500` (unexpected failure).
- **CORS**: not applicable — API and web share one origin. If `NEXT_PUBLIC_API_URL` ever points at an external service, that service owns its allowlist.

---

## 3. Endpoints

### 3.1 `POST /api/v1/analyse` — run a citation audit

Multipart form-data. Accepts exactly one of:
- `file` — `.docx` (mammoth), `.pdf` (unpdf), anything else as UTF-8 text (≤ `MAX_UPLOAD_MB`, default 10 MB). Unparseable uploads are rejected `400` by the parser that throws.
- `text` — pasted manuscript text (plain string field, ≤ `MAX_TEXT_CHARS`, default 200,000)

| Field | Type | Required | Notes |
|---|---|---|---|
| `file` | file | one-of | Document file |
| `text` | string | one-of | Pasted text |
| `citation_style` | string | yes | `apa7`, `apa6`, `harvard`, `vancouver`, `chicago-author-date`, `chicago-notes`, `mla9`, `ieee`, `oscola`, `turabian` |
| `mode` | string | no | `full` (default, `manuscript` accepted) or `reference_only` (`references_only`/`references` accepted) |

**Response `200`** — `AuditResponse` (see §4). Latency: 5–15 s short docs; up to ~3 min thesis-length (`14-ai-nlp-design.md` §9).

### 3.2 `POST /api/v1/export/pdf`

| Field | Type | Required |
|---|---|---|
| `analysis_data` | `AuditResponse` | yes |

**Response `200`**: `application/pdf` attachment (analysis report). **`400`** if the payload is not a valid audit result.

### 3.3 `POST /api/v1/export/docx`

| Field | Type | Required |
|---|---|---|
| `text` | string | yes — original manuscript text |
| `analysis_data` | `AuditResponse` | yes |

**Response `200`**: `application/vnd.openxmlformats-officedocument.wordprocessingml.document` — annotated manuscript (errors highlighted inline).

### 3.4 `GET /health` · `GET /api/health`

- `GET /health` and `GET /api/health` → `200` liveness with `{ status, service, version, ai_engine_ready, model }`. There is no `/health/deep` endpoint.

### 3.5 `WS /api/v1/ws/analyse` — streaming audit (roadmap)

WebSocket variant of `/analyse` for real-time progress events. Defined for future UX; not shipped in the MVP.

---

## 4. `AuditResponse` Schema

Canonical shape: `citepilot-web/src/lib/types.ts` (`AuditResponse`). Top-level fields:

| Field | Type | Notes |
|---|---|---|
| `citations` | `Citation[]` | In-text citations: `raw_text`, `paragraph_index`, `status` (`matched`/`no_match`), `matched_reference_index`, `match_type` (`exact`/`fuzzy`/`ai_verified`/`none`), `issues[]` |
| `references` | `Reference[]` | `raw_entry`, `status` (`cited`/`orphaned`/`retracted`), `parsed_doi`, `crossref_validation` (`{crossref_verified, discrepancies[{field,message,how_to_fix}]}`), `retraction_info` |
| `style_warnings` | `StyleWarning[]` | `code`, `message`, `target_text`, `suggestion`, `educational_context` |
| `uncited_claims` | `UncitedClaim[]` | `claim_text`, `paragraph_index`, `suggestion`, `educational_context` |
| `recency` | `RecencyData` | Source-age counts and percentages (3/5/10-year windows), `average_source_age_years`. No compliance tiers are returned. |
| `mode` / `elapsed_seconds` | | Echoed audit mode and wall-clock seconds |

> **Note:** `structure` / `layout_issues` / `document_structure` and `text` / `manuscript_text` exist as optional client-side fields in `src/lib/types.ts` but are **not** returned by the API — the client keeps manuscript text locally and exports render from it.

---

## 5. Error Taxonomy

| Code | Meaning | Mitigation |
|---|---|---|
| `400` | Invalid request (missing file+text, unknown style/mode, empty or corrupt upload) | Fix form fields |
| `401` | Invalid or missing API key (only when `API_KEY` is set) | Send `X-API-Key` or `Bearer` token |
| `413` | Over `MAX_UPLOAD_MB` / `MAX_TEXT_CHARS` | Split document / convert to text |
| `429` | In-memory per-IP rate limit exceeded | Retry after backoff; see `06-operations/25-runbooks.md` |
| `503` | Gemini unavailable across all fallback models | Retry; check Google AI Studio quotas |
| `500` | Unexpected internal error | Report with request metadata |

---

## 6. Versioning & Stability

- The MVP API is unversioned **contract-stable**: additive changes only.
- Breaking changes require a version bump to `/api/v2` and an ADR entry.
- Paywall/subscription data flows through the frontend PayPal JS SDK (`citepilot-web`) with server routes (`/api/subscription/activate`, PayPal webhooks) verifying state — plan/feature flags live in Supabase, not a gateway (ADR-010).