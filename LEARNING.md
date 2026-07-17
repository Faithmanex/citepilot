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
- **Install command**: Leave blank (defaults to `pnpm install`).
- **Redeploy after env changes**: Run `npx vercel --prod` from the monorepo root (not from `citepilot-web/`) because Root Directory is already set in the project config.

## Database: Vercel Postgres, not Supabase

Supabase was used in early iterations but replaced with Vercel Postgres for production. The `supabase/migrations/` directory still contains the SQL schema — run those migrations in Vercel's query editor to set up tables.

- **Connection string**: `DATABASE_URL` in `citepilot-gateway/.env`
- **Local PostgreSQL**: Started manually from `%USERPROFILE%\pgdata`, not as a Windows service.

## README is stale

The top-level `README.md` document index and directory tree do not match the on-disk layout. Trust the file system and `AGENTS.md` for navigation. On-disk document IDs use schemes like `CP-DS-001`, `CP-ARCH-010`, `CITE-ENG-017` — NOT the `CP-PROD-0XX` scheme claimed in the README.

## Railway env vars required for deployment

### Gateway (`citepilot-gateway`)
| Variable | Notes |
|---|---|
| `DATABASE_URL` | Vercel Postgres connection string |
| `JWT_SECRET` | Any secure string |
| `AI_SERVICE_URL` | e.g. `https://citepilot-ai.up.railway.app` |
| `NODE_ENV` | `production` |

### AI service (`citepilot-ai`)
| Variable | Notes |
|---|---|
| `GOOGLE_API_KEY` | Required for analysis — not validated at startup, so healthcheck passes without it |

## Environment quirks (Windows dev machine)

- **Python**: `uv` is the package manager, not `pip`. Start the AI service with `uv run uvicorn citepilot_ai.main:app --host 0.0.0.0 --port 8000 --reload`.
- **Node.js**: `pnpm` is the package manager. Start the gateway with `pnpm dev` from `citepilot-gateway/`.
- **PostgreSQL**: Manually started from `%USERPROFILE%\pgdata`. Not a Windows service, not Docker.
- **Gateway requires `DATABASE_URL`** in `citepilot-gateway/.env` before it will start.
