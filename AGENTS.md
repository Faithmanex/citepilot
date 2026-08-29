# CitePilot — Agent Guide

This is the CitePilot monorepo containing code for the web frontend (`citepilot-web/`), AI service (`citepilot-ai/`), and Supabase migrations (`supabase/migrations/`), alongside the 7-folder documentation suite. The `citepilot-gateway` described in `04-engineering-standards/17-engineering-guidelines.md` has not been extracted as a separate repo in this checkout.

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
| `citepilot-web/` | Next.js 16.2 frontend (vendored in this monorepo) |
| `citepilot-ai/` | Python 3.12 FastAPI AI service (vendored in this monorepo) |
| `supabase/migrations/` | 14 SQL migrations — DB source of truth |

Document IDs on disk use schemes `CP-DS-001`, `CP-ARCH-010`, `CITE-ENG-017` etc. — not the obsolete `CP-PROD-0XX` scheme.

## Implementation repos (vendored)

The working code is vendored in this monorepo (not as git submodules):

| Repo | Stack |
|---|---|
| `citepilot-web` | Next.js 16.2, TypeScript 5.9, Tailwind CSS 4, Vitest |
| `citepilot-ai` | Python 3.12, FastAPI 0.115, pytest |

The `citepilot-gateway` (Node.js 22 LTS / Express 5 / Drizzle / BullMQ) referenced in `04-engineering-standards/17-engineering-guidelines.md` and `LEARNING.md` is not present as a separate checkout here; AI calls go directly via `next.config.ts` rewrites to `NEXT_PUBLIC_API_URL` / Railway.

## Key architecture docs

For system understanding, read in this order:
1. `03-technical-architecture/10-system-architecture.md` — high-level design
2. `03-technical-architecture/11-technology-stack.md` — every tech choice with rationale
3. `03-technical-architecture/13-database-schema.md` — PostgreSQL 16 schema
4. `03-technical-architecture/12-api-specification.md` — REST API contract
5. `03-technical-architecture/14-ai-nlp-design.md` — AI pipeline (OpenAI/Claude)

## Document conventions

- All docs are Markdown with YAML-style headers (`Document ID`, `Version`, `Last Updated`, `Status`)
- Update `Last Updated` and increment `Version` on substantive changes
- Cross-references use relative paths; keep them valid
- ADRs live in `04-engineering-standards/18-architecture-decision-records.md`

## Deployment automation rules

- **Always set missing env vars** — when a deployment error points to a missing or incorrect environment variable, set it immediately via CLI (e.g., `vercel env add`, Railway dashboard). Do not leave it for later.
- **Always redeploy after env changes** — after setting or updating environment variables, trigger a redeploy immediately. For Vercel: `npx vercel --prod` **from the monorepo root** (Vercel Root Directory is set to `citepilot-web/` — do NOT `cd` into it, per `LEARNING.md`). For Railway: trigger via dashboard or `railway up`.
- **Verify CORS allowlist** — when changing API URLs or domains, ensure CORS is updated:
  - Web → AI: `citepilot-ai` `CORS_ORIGINS` env var (Railway) and `citepilot-web/next.config.ts` rewrites.
  - Legacy gateway reference `citepilot-gateway/src/server.ts` does not exist in this checkout.
