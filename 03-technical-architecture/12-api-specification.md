# 12 — API Specification

> **Document ID:** CP-ARCH-012
> **Version:** 1.1.0
> **Last Updated:** 2026-08-11
> **Status:** Approved
> **Owner:** Engineering — API Team
> **Classification:** Internal

---

## 1. Overview

This document specifies the CitePilot HTTP API. The MVP is **sessionless and synchronous**: the frontend (`citepilot-web`) calls the FastAPI service (`citepilot-ai`) for analysis and export; the Express gateway proxies these routes and owns CORS/paywall-flags, and the FastAPI service records audit history rows.

> **Revision note:** This v1.1.0 supersedes the previous design (accounts, JWT auth, document/results CRUD, `202 Accepted` job polling, S3, Stripe). Those concepts were removed with the synchronous, sessionless MVP (ADR-009/010/011). The executable contract lives in `citepilot-ai/src/api/endpoints.py`, `citepilot-ai/src/api/schemas.py`, and `citepilot-web/src/lib/api.ts` — when code and this document disagree, code wins.

---

## 2. Conventions

- **Base URL**: `/api/v1`. In production the frontend calls `NEXT_PUBLIC_API_URL`; unset in the browser, it falls back to same-origin `/api/v1` (gateway proxies the AI service). Local dev default: `http://localhost:8000/api/v1`.
- **Transport**: HTTPS in production; JSON request/response bodies except where noted; uploads use `multipart/form-data`.
- **Errors**: JSON body `{"detail": "<message>"}` (FastAPI default) — the frontend reads `detail` then `message`. Status codes: `400` (bad request), `413` (file too large), `415` (unsupported media type), `429` (rate limit / Gemini quota), `5xx` (service failure).
- **CORS**: enforced by the gateway; production allowlist `https://citepilot.com` + `https://www.citepilot.com` (see `citepilot-gateway/src/server.ts`).

---

## 3. Endpoints

### 3.1 `POST /api/v1/analyse` — run a citation audit

Multipart form-data. Accepts exactly one of:
- `file` — `.docx`, `.pdf`, `.txt`, `.rtf`, `.bib` (≤ 50 MB; server-side MIME + magic-byte checks)
- `text` — pasted manuscript text (plain string field)

| Field | Type | Required | Notes |
|---|---|---|---|
| `file` | file | one-of | Document file |
| `text` | string | one-of | Pasted text |
| `citation_style` | string | yes | `apa7`, `apa6`, `harvard`, `vancouver`, `chicago-author-date`, `chicago-notes`, `mla9`, `ieee`, `oscola`, `turabian` |
| `audit_mode` | string | no | `full` (default) or `reference_only` |

**Response `200`** — `AuditResponse` (see §4). Latency: 5–15 s short docs; up to ~3 min thesis-length (`14-ai-nlp-design.md` §8).

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

### 3.4 `GET /health` · `GET /health/deep`

- `GET /health` → `200` liveness.
- `GET /health/deep` → `200` when DB reachable, `503` otherwise.

### 3.5 `WS /api/v1/ws/analyse` — streaming audit (roadmap)

WebSocket variant of `/analyse` for real-time progress events. Defined for future UX; not shipped in the MVP.

---

## 4. `AuditResponse` Schema

Canonical shape: `citepilot-web/src/lib/types.ts` (`AuditResponse`). Top-level fields:

| Field | Type | Notes |
|---|---|---|
| `citations` | `Citation[]` | In-text citations: `raw_text`, `paragraph_index`, `status` (`matched`/`no_match`), `matched_reference_index`, `match_type` (`exact`/`fuzzy`), `issues[]` |
| `references` | `Reference[]` | `raw_entry`, `status` (`matched`/`orphaned`/`retracted`), `parsed_doi`, `crossref_validation` (`{crossref_verified, discrepancies[{field,message,how_to_fix}]}`), `retraction_info` |
| `style_warnings` | `StyleWarning[]` | `code`, `message`, `target_text`, `suggestion`, `educational_context` |
| `uncited_claims` | `UncitedClaim[]` | `claim_text`, `paragraph_index`, `suggestion`, `educational_context` |
| `recency` | `RecencyData` | Source-age statistics: `within_3_years_count`, `within_5_years_percent`, `within_10_years_percent`, `older_than_10_years_percent`, `average_source_age_years`, `recency_compliance_status` |
| `structure` / `layout_issues` / `document_structure` | `StructureIssue[]` | Structural findings: `severity`, `title`, `rule`, `category`, `description`, `how_to_fix` |
| `text` / `manuscript_text` | string | Text echoed back to the client for export rendering |

---

## 5. Error Taxonomy

| Code | Meaning | Mitigation |
|---|---|---|
| `400` | Invalid request (missing file+text, unknown style) | Fix form fields |
| `413` | File > 50 MB | Split document / convert to text |
| `415` | Unsupported file type or spoofed extension | Re-save as `.docx`/`.pdf`/`.txt`/`.rtf`/`.bib` |
| `429` | Rate limited or Gemini quota exhausted | Retry after backoff; see `06-operations/25-runbooks.md` |
| `502/503` | AI service down / restarting | Retry; platform auto-restarts |
| `500` | Unexpected internal error | Report with request metadata |

---

## 6. Versioning & Stability

- The MVP API is unversioned **contract-stable**: additive changes only.
- Breaking changes require a version bump to `/api/v2` and an ADR entry.
- Paywall/subscription data flows through the frontend PayPal JS SDK (`citepilot-web`) with the gateway holding plan/feature flags — there is no backend subscription API in the MVP (ADR-010).