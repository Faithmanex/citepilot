# CitePilot — Lessons Learned

Project-specific gotchas, root causes of past failures, and patterns that future sessions should know.

## AI service migrated from Python (FastAPI) to Next.js Route Handlers

The AI analysis service was ported from Python/FastAPI (`citepilot-ai/`, Railway) into the web app so **everything deploys to one Vercel project**. The Python service was removed after the port (it remains in git history).

- **Location**: `citepilot-web/src/lib/ai/` (services) + `citepilot-web/src/app/api/{v1,health}` (Route Handlers).
- **Endpoints**: `POST /api/v1/analyse`, `POST /api/v1/export/pdf`, `POST /api/v1/export/docx`, `GET /api/health`, `GET /health`.
- **No rewrite**: `next.config.ts` no longer proxies `/api/v1/*` to Railway. The client (`src/lib/api.ts`) calls same-origin `/api/v1` when `NEXT_PUBLIC_API_URL` is unset.
- **Library swaps**: Gemini via `@google/genai`; schemas via `zod`; DOCX parse via `mammoth`; PDF parse via `unpdf`; DOCX export via `docx`; PDF export via `pdf-lib`.
- **Jev (TypeSafe) removed**: the opt-in decision layer (`src/lib/ai/jev.ts`, ADR-012) was deleted — verification is Crossref/OpenAlex metadata only, and retraction needs explicit Crossref signals (no title-prefix guessing). Do not reintroduce `TYPESAFE_*` variables.
- **Gotcha**: the route handlers use the Node runtime (`export const runtime = "nodejs"`). Do not switch them to Edge — `Buffer`, `mammoth`, and `unpdf` require Node.

## `FUNCTION_INVOCATION_TIMEOUT` on `/api/v1/*`

Two independent causes, both fixed 2026-10-22:

1. **Stale Railway rewrite.** `citepilot-web/vercel.json` still proxied `/api/v1/:path*` to `citepilot-ai-production.up.railway.app` (the retired Python service). Every API call went to a dead origin and hung until the platform timeout. There must be **no** rewrite — the route handlers live in this app. If you see a Railway URL in `vercel.json`, delete it.
2. **Unbounded pipeline work.** `maxDuration = 60` is the function cap, but the pipeline (Gemini extraction → matching → style → Crossref/OpenAlex/retraction fan-out) had no internal budget and no concurrency cap, so large manuscripts/reference lists overran it. `runAnalysisPipeline` now takes a deadline from `ANALYSIS_BUDGET_MS` (default 45s), Gemini calls get `GEMINI_TIMEOUT_MS` plus a hard wall-clock race, and provider verification uses `VERIFY_CONCURRENCY`. Past the deadline, stages are skipped and reported as `verification_unavailable`/`checks: skipped(budget)` rather than being killed mid-response.

## Gemini DEADLINE_EXCEEDED with a valid key (fixed 2026-11-14)

The audit's 503 after ~58s was **not** a configuration or quota problem:

- `GET /v1beta/models` with the account key returned 200 and listed `gemini-3.8-flash`.
- A minimal `generateContent` call to `gemini-3.8-flash` **never returned** (still hanging after 90s, both via the SDK and plain REST).
- The same request against `gemini-2.5-flash` returned in **1.8s**, and `gemini-3-flash-preview` in 1.3s.

A listed model is therefore not a working model. The default is now `gemini-2.5-flash`; `GEMINI_MODEL` still overrides it. Before switching models again, run a minimal provider call with a hard timeout and measure latency — do not assume a model name in the catalog is usable.

Related contract changes:

- Every provider call is raced against a wall-clock timeout (`withTimeout`) because the SDK's `httpOptions.timeout` alone did not bound a hung request.
- Errors are classified (`timeout`, `rate_limit`, `invalid_config`, `provider_error`, `invalid_response`, `budget_exhausted`). Invalid credentials are **never** retried; transient errors only retry while budget and `MIN_ATTEMPT_MS` remain.
- `/api/health` no longer equates "API key present" with "ready". `status` is liveness; `provider_readiness.state` is `unverified` until `?probe=1` performs a real (cached) provider call. `ai_engine_ready` is true only after that probe succeeds.
- The analyse response now carries `request_id`, `status` (`completed`/`partial`), and per-stage `checks` with durations. A partial audit must never be rendered as a clean one.

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

## Next.js 16: middleware is now `proxy`

`src/middleware.ts` was renamed to `src/proxy.ts` with `export async function proxy(request)` (Next 16.2 deprecates the middleware convention). The matcher is unchanged; Supabase session refresh still runs through `updateSession`. The build output should list `ƒ Proxy (Middleware)` and must not warn about middleware.

## Dashboard audit state model

`src/lib/auditState.ts` is the single source of truth for whether an audit is empty, ready, running, current, stale, partial, or failed. Rules:

- `revision` increments on any text/file change; every result is stored with the revision, style, and mode used to produce it.
- A response is applied only if its request id, revision, style, and mode all still match. A response that arrives after the document changed is discarded.
- A style or mode change marks the previous result stale.
- `checks` with `status: "skipped"` and `reason: "not_applicable"` (e.g. citations in reference-only mode) do **not** make an audit partial; `unavailable` or budget-skipped checks do.
- "Nothing flagged" is rendered only for a current, fully completed audit with zero findings.

Do not render result counts directly from `analysisData`; derive the phase from `auditSummary(state)` so an unrun/failed/stale run cannot look clean.

## Saved audits and privacy copy

Auto-save (`/api/audits/save`) stores the audit result for signed-in users, and the save payload now embeds `manuscript_text` in `results` so history loads the correct document. Older rows have no text; the dashboard refuses to attach their findings to whatever text is currently in the editor and shows a read-only notice instead. Landing/FAQ privacy copy must reflect this (it previously claimed the service was sessionless and stored nothing).

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
| `GEMINI_MODEL` | Optional, defaults to `gemini-2.5-flash` (the previously configured `gemini-3.8-flash` hung on every call) |
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
