# CitePilot — Agent Guide

This is the CitePilot monorepo containing code for the web frontend (`citepilot-web/`), the (now co-located) AI service, and Supabase migrations (`supabase/migrations/`), alongside the 7-folder documentation suite. As of the Node migration, the AI analysis service runs **inside `citepilot-web/`** as Next.js Route Handlers so the whole product deploys to a single Vercel project. The original Python FastAPI service (`citepilot-ai/`) was removed after the port; it remains available in git history.

**Read [`LEARNING.md`](LEARNING.md) for project-specific gotchas, past root causes, and deployment quirks.**

## Repo structure

The on-disk layout is the source of truth:

| Path | Contents |
|---|---|
| `01-discovery-strategy/` | Discovery & strategy docs |
| `02-design/` | Design system + wireframes (also contains historical HTML mocks) |
| `03-technical-architecture/` | System architecture, tech stack, API spec, DB schema |
| `04-engineering-standards/` | Engineering guidelines, ADRs, testing strategy |
| `05-legal-compliance/` | Legal & compliance docs |
| `06-operations/` | Runbooks, incident response |
| `07-launch/` | Launch checklist, support docs |
| `citepilot-web/` | Next.js 16.2 frontend **+ AI API routes** (vendored in this monorepo) |
| `supabase/migrations/` | 14 SQL migrations — DB source of truth |

Document IDs on disk use schemes `CP-DS-001`, `CP-ARCH-010`, `CITE-ENG-017` etc. — not the obsolete `CP-PROD-0XX` scheme.

## Implementation repos (vendored)

The working code is vendored in this monorepo (not as git submodules):

| Repo | Stack |
|---|---|
| `citepilot-web` | Next.js 16.2, TypeScript 5.9, Tailwind CSS 4, Vitest — **web + AI Route Handlers** |

### AI service (co-located)

The AI pipeline lives in `citepilot-web/src/lib/ai/` and is exposed as Next.js Route Handlers:

| Route | Purpose |
|---|---|
| `POST /api/v1/analyse` | Multipart analyse (text or file) → citations, references, style warnings, uncited claims, recency |
| `POST /api/v1/export/pdf` | Diagnostic PDF report (pdf-lib) |
| `POST /api/v1/export/docx` | Clean / redline DOCX export (docx) |
| `GET /api/health` and `GET /health` | Liveness + `ai_engine_ready` / `model` |

Key modules: `config.ts`, `llm.ts` (Gemini), `schemas.ts` (zod), `citation-extractor.ts`, `crossref.ts`, `openalex.ts`, `retraction.ts`, `recency.ts`, `uncited-claims.ts`, `document-parser.ts` (mammoth/unpdf), `export.ts`, `pipeline.ts`, `jev.ts` (opt-in, no-op by default). The client (`src/lib/api.ts`) calls same-origin `/api/v1` when `NEXT_PUBLIC_API_URL` is unset — there is **no** external rewrite.

## Key architecture docs

For system understanding, read in this order:
1. `03-technical-architecture/10-system-architecture.md` — high-level design
2. `03-technical-architecture/11-technology-stack.md` — every tech choice with rationale
3. `03-technical-architecture/13-database-schema.md` — PostgreSQL 16 schema
4. `03-technical-architecture/12-api-specification.md` — REST API contract
5. `03-technical-architecture/14-ai-nlp-design.md` — AI pipeline

## Document conventions

- All docs are Markdown with YAML-style headers (`Document ID`, `Version`, `Last Updated`, `Status`)
- Update `Last Updated` and increment `Version` on substantive changes
- Cross-references use relative paths; keep them valid
- ADRs live in `04-engineering-standards/18-architecture-decision-records.md`

## Deployment automation rules

- **Always set missing env vars** — when a deployment error points to a missing or incorrect environment variable, set it immediately via CLI (e.g., `vercel env add`, Railway dashboard). Do not leave it for later.
- **Always redeploy after env changes** — after setting or updating environment variables, trigger a redeploy immediately. For Vercel: `npx vercel --prod` **from the monorepo root** (Vercel Root Directory is set to `citepilot-web/` — do NOT `cd` into it, per `LEARNING.md`). Railway is no longer used (the Python service is retired).
- **No cross-origin CORS needed** — the AI routes are same-origin Next.js Route Handlers inside the web app. If you ever point `NEXT_PUBLIC_API_URL` at an external service, add that service's origin to its own CORS allowlist.
- **AI secrets live in Vercel** — set `GOOGLE_API_KEY`, `GEMINI_MODEL`, `CROSSREF_MAILTO`, and the optional limit/`API_KEY`/`TYPESAFE_*` variables in the Vercel project (see `citepilot-web/.env.example`).
