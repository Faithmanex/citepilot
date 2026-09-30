# CitePilot — Lessons Learned

Project-specific gotchas, root causes of past failures, and patterns that future sessions should know.

## AI service migrated from Python (FastAPI) to Next.js Route Handlers

The AI analysis service was ported from Python/FastAPI (`citepilot-ai/`, Railway) into the web app so **everything deploys to one Vercel project**. The Python service was removed after the port (it remains in git history).

- **Location**: `citepilot-web/src/lib/ai/` (services) + `citepilot-web/src/app/api/{v1,health}` (Route Handlers).
- **Endpoints**: `POST /api/v1/analyse`, `POST /api/v1/export/pdf`, `POST /api/v1/export/docx`, `GET /api/health`, `GET /health`.
- **No rewrite**: `next.config.ts` no longer proxies `/api/v1/*` to Railway. The client (`src/lib/api.ts`) calls same-origin `/api/v1` when `NEXT_PUBLIC_API_URL` is unset.
- **Library swaps**: Gemini via `@google/genai`; schemas via `zod`; DOCX parse via `mammoth`; PDF parse via `unpdf`; DOCX export via `docx`; PDF export via `pdf-lib`.
- **Jev (TypeSafe)**: the Python SDK has no Node equivalent, so `src/lib/ai/jev.ts` is a **fail-open no-op** (default disabled). No behavior change unless `TYPESAFE_API_KEY` is set.
- **Gotcha**: the route handlers use the Node runtime (`export const runtime = "nodejs"`). Do not switch them to Edge — `Buffer`, `mammoth`, and `unpdf` require Node.

## TOML: dependencies must be under `[project]`

In `pyproject.toml`, runtime dependencies must be placed directly under the `[project]` table per [PEP 621](https://peps.python.org/pep-0621/). If they end up under `[build-system]` (e.g. after a mis-edit), `uv` and `pip` silently ignore them — no error, no install.

**Symptom**: Container builds and pushes successfully, but the app fails immediately at startup with `ModuleNotFoundError`. Healthcheck returns 503 "service unavailable".

**Check**: Verify `uv.lock` lists the package's runtime deps under `requires-dist`. If only dev deps are present, the dependencies are in the wrong section.

**Fix**: Move the `dependencies = [...]` list under `[project]`, then run `uv lock` to regenerate `uv.lock`.

## Railway: Railpack replaced Nixpacks

Railway deprecated Nixpacks in favour of Railpack (2025–2026). Key differences:

- **No more `NIXPACKS_BUILD_DIR`** — Railpack reads `railway.json` for the build context instead. Setting this env var has no effect.
- **Each service needs its own `railway.json`** with `"builder": "RAILPACK"` and the correct `startCommand`.
- **Start command path matters** — for Python/uv projects, use the bare command (`uvicorn citepilot_ai.main:app ...`), not `python -m uvicorn`. Railpack links the Python executable from the uv-managed venv; `python -m` may reference a different interpreter that lacks the installed packages.
- **Build is faster and smaller** — Railpack produces smaller images (77% smaller for Python) via BuildKit caching.

## Railway healthcheck false negatives

A failing `/health` probe almost never means the health endpoint is wrong. It means the application process never started listening on the port. Common causes:

1. Missing or misplaced `pyproject.toml` dependencies (see above)
2. Wrong start command (e.g. `python -m` instead of bare `uvicorn`)
3. Missing `$PORT` (Railway injects this automatically, but if the start command doesn't reference it, uvicorn may fail to bind)
4. Import errors at module level (check Railway deploy logs for tracebacks)

## Vercel monorepo deployment rules

- **Root Directory** must be set to `citepilot-web/` in Vercel project settings. Do NOT use `cd citepilot-web` in any script — it will break because the working directory is already `citepilot-web/`.
- **Build command**: Leave blank (defaults to `next build`).
- **Install command**: Leave blank (defaults to `npm install` — `citepilot-web/package-lock.json` is npm; `pnpm` also works if you prefer, but do not mix lockfiles).
- **Redeploy after env changes**: Run `npx vercel --prod` from the monorepo root (not from `citepilot-web/`) because Root Directory is already set in the project config.

## Database: Supabase (with Vercel Postgres legacy note)

Early iterations used Supabase; Vercel Postgres was briefly used in production before settling back on Supabase (auth + RLS) as the source of truth in `supabase/migrations/` (14 files). Run migrations in the Supabase SQL editor (or Vercel query editor if still on Vercel Postgres).

- **Connection string**: `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` in `citepilot-web/.env.local`; `DATABASE_URL` if still on Vercel Postgres gateway setup.
- **Local PostgreSQL**: Started manually from `%USERPROFILE%\pgdata`, not as a Windows service.

## README is stale (fixed 2026-08-26)

The top-level `README.md` document index and directory tree previously did not match the on-disk layout — fixed to reflect 14 migrations and vendored repos. Trust the file system and `AGENTS.md` for navigation. On-disk document IDs use schemes like `CP-DS-001`, `CP-ARCH-010`, `CITE-ENG-017` — NOT the `CP-PROD-0XX` scheme. `AGENTS.md` previously claimed a 3-repo polyrepo layout — corrected to vendored monorepo.

## Railway env vars required for deployment

### Web (`citepilot-web` on Vercel)
| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Required** — fail-loudly if missing (used by `src/lib/supabase/admin.ts` for webhooks/subscriptions) |
| `NEXT_PUBLIC_API_URL` | Optional — leave unset to use the co-located API at `<origin>/api/v1` |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | PayPal app credentials (for webhook/activate verification) |
| `PAYPAL_WEBHOOK_ID` | PayPal webhook ID (required in prod — webhooks without it are rejected) |
| `PAYPAL_API_BASE` | Optional, defaults to `https://api-m.paypal.com` |
| `GOOGLE_API_KEY` | **Required for analysis** — powers the `/api/v1/analyse` Gemini pipeline (503 if missing) |
| `GEMINI_MODEL` | Optional, defaults to `gemini-2.5-flash-lite` |
| `CROSSREF_MAILTO` | Optional contact email for the Crossref polite pool |
| `API_KEY` | Optional — if set, clients must send `X-API-Key` or `Authorization: Bearer <key>` |
| `MAX_UPLOAD_MB` / `MAX_TEXT_CHARS` / `RATE_LIMIT_PER_MINUTE` | Optional AI request limits |
| `NODE_ENV` | `production` |

See `citepilot-web/.env.example` for the full list.

### AI service (Railway) — RETIRED
The Python FastAPI service and its Railway deploy are gone (source removed after the port). Its env vars were migrated into the Vercel project (see the Web table above). Kept here for historical reference only.

### Legacy Gateway (`citepilot-gateway` — not present in this checkout)
| Variable | Notes |
|---|---|
| `DATABASE_URL` | Vercel Postgres connection string (legacy) |
| `JWT_SECRET` | Any secure string (legacy) |
| `AI_SERVICE_URL` | e.g. `https://citepilot-ai.up.railway.app` (legacy) |

## Environment quirks (Windows dev machine)

- **AI service**: now runs inside the web app — start everything with `npm run dev` (Next.js) from `citepilot-web/`. The legacy Python service, if you ever run it locally, uses `uv run uvicorn citepilot_ai.main:app --host 0.0.0.0 --port 8000 --reload`.
- **Node.js**: `npm` is the package manager for `citepilot-web` (`package-lock.json` present); `pnpm` also works but do not mix lockfiles. The legacy `citepilot-gateway` (not in this checkout) used `pnpm`.
- **PostgreSQL / Supabase**: Migrations live in `supabase/migrations/` — apply via Supabase dashboard SQL editor.
- **Security hardening (2026-08-26)**: See `supabase/migrations/014_fix_rls_and_hardening.sql` — RLS now covers all user-data tables, `users` UPDATE is locked against privilege escalation, and `handle_new_user()` has pinned `search_path`.
