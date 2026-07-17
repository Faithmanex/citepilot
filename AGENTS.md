# CitePilot — Agent Guide

This is the CitePilot monorepo containing code for the web frontend (`citepilot-web/`), API gateway (`citepilot-gateway/`), and AI service (`citepilot-ai/`).

## Repo structure vs README

The **README's document index and directory tree are stale**. Trust the on-disk structure:

| On disk | README claims |
|---|---|
| `01-discovery-strategy/` | `01-product/` |
| `02-design/` | `02-architecture/` |
| `03-technical-architecture/` | `03-frontend/` |
| `04-engineering-standards/` | `04-backend/` |
| `05-legal-compliance/` | `05-qa/` |
| `06-operations/` | `06-operations/` |
| `07-launch/` | `07-launch/` |

Document IDs on disk (`CP-DS-001`, `CP-ARCH-010`, `CITE-ENG-017`) also differ from the README's claimed `CP-PROD-0XX` scheme — use the actual file headers.

## Implementation repos (polyrepo)

The actual code lives in three separate repositories per `04-engineering-standards/17-engineering-guidelines.md:

| Repo | Stack |
|---|---|
| `citepilot-web` | Next.js 16.2, TypeScript 7.0, Tailwind CSS 4, Vitest |
| `citepilot-gateway` | Node.js 22 LTS, Express 5 / tRPC, Drizzle ORM, BullMQ, Vitest |
| `citepilot-ai` | Python 3.12, FastAPI 0.115, pytest |

Shared types: `@citepilot/shared-types` (web ↔ gateway), `citepilot-contracts` (gateway ↔ AI).

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
- **Always redeploy after env changes** — after setting or updating environment variables, trigger a redeploy immediately. For Vercel: `npx vercel --prod` from `citepilot-web/`. For Railway: trigger via dashboard or `railway up`.
- **Verify CORS allowlist** — when changing API URLs or domains, ensure the gateway CORS config (`citepilot-gateway/src/server.ts`) includes the new origin.
