# CitePilot — Lessons Learned

Project-specific gotchas, root causes of past failures, and patterns that future sessions should know.

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
| `NEXT_PUBLIC_API_URL` | e.g. `https://citepilot-ai.up.railway.app/api/v1` |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | PayPal app credentials (for webhook/activate verification) |
| `PAYPAL_WEBHOOK_ID` | PayPal webhook ID (required in prod — webhooks without it are rejected) |
| `PAYPAL_API_BASE` | Optional, defaults to `https://api-m.paypal.com` |
| `NODE_ENV` | `production` |

### AI service (`citepilot-ai` on Railway)
| Variable | Notes |
|---|---|
| `GOOGLE_API_KEY` | Required for analysis — not validated at startup, so healthcheck passes without it |
| `CITE_API_KEY` / `API_KEY` | Optional — if set, clients must send `X-API-Key` or `Authorization: Bearer <key>` (recommended for production) |
| `CORS_ORIGINS` | Comma-separated allowlist, e.g. `https://citepilot.ai,https://www.citepilot.ai` — do not use `*` in prod when API key is set |
| `RATE_LIMIT_PER_MINUTE` | Optional, defaults to 20 |

### Legacy Gateway (`citepilot-gateway` — not present in this checkout)
| Variable | Notes |
|---|---|
| `DATABASE_URL` | Vercel Postgres connection string (legacy) |
| `JWT_SECRET` | Any secure string (legacy) |
| `AI_SERVICE_URL` | e.g. `https://citepilot-ai.up.railway.app` (legacy) |

## Environment quirks (Windows dev machine)

- **Python**: `uv` is the package manager, not `pip`. Start the AI service with `uv run uvicorn citepilot_ai.main:app --host 0.0.0.0 --port 8000 --reload`.
- **Node.js**: `npm` is the package manager for `citepilot-web` (`package-lock.json` present); `pnpm` also works but do not mix lockfiles. The legacy `citepilot-gateway` (not in this checkout) used `pnpm`.
- **PostgreSQL / Supabase**: Migrations live in `supabase/migrations/` — apply via Supabase dashboard SQL editor.
- **Security hardening (2026-08-26)**: See `supabase/migrations/014_fix_rls_and_hardening.sql` — RLS now covers all user-data tables, `users` UPDATE is locked against privilege escalation, and `handle_new_user()` has pinned `search_path`.
