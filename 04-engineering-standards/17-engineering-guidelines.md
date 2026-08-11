│       └── lib/
│           ├── __init__.py
│           ├── logger.py
│           ├── errors.py
│           └── metrics.py
├── tests/
│   ├── unit/
│   ├── integration/
│   └── golden/                   # Golden dataset test fixtures
│       ├── apa7/
│       ├── harvard/
│       └── vancouver/
├── pyproject.toml
├── ruff.toml
├── Dockerfile
└── README.md
```

---

## 4. Code Style Guide

### 4.1 TypeScript / React (Frontend & Gateway)

#### Language Version & Configuration

- **TypeScript:** Strict mode enabled (`"strict": true` in `tsconfig.json`).
- **Target:** ES2022. Module: ESNext.
- **No `any`:** The `any` type is banned. Use `unknown` and narrow with type guards.
- **No non-null assertions:** `!` operator is prohibited. Use optional chaining and explicit checks.

#### Formatting & Naming

| Element | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `CitationCard.tsx` |
| Files (utilities) | kebab-case | `api-client.ts` |
| Files (hooks) | camelCase with `use` prefix | `useDocumentUpload.ts` |
| Files (tests) | Same as source + `.test` | `CitationCard.test.tsx` |
| Variables | camelCase | `citationCount` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_UPLOAD_SIZE_BYTES` |
| Functions | camelCase | `extractCitations()` |
| React components | PascalCase | `ResultsTable` |
| Interfaces | PascalCase, no `I` prefix | `CitationResult` |
| Type aliases | PascalCase | `DocumentStatus` |
| Enums | PascalCase members | `UploadStatus.Processing` |
| CSS classes | kebab-case (Tailwind utilities) | `text-brand-primary` |
| Environment variables | SCREAMING_SNAKE_CASE with `NEXT_PUBLIC_` prefix for client | `NEXT_PUBLIC_API_URL` |

#### React Conventions

```tsx
// ✅ Preferred: Function declaration for components
export function CitationCard({ citation, onIgnore }: CitationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <article
      role="article"
      aria-label={`Citation by ${citation.author}`}
      className="rounded-lg border p-4"
    >
      {/* Component body */}
    </article>
  );
}

// ✅ Props interface co-located above the component
interface CitationCardProps {
  citation: Citation;
  onIgnore: (citationId: string) => void;
}
```

Rules:
- Use function declarations, not arrow functions, for top-level components.
- Props interface defined directly above the component in the same file.
- Destructure props in the function signature.
- Use semantic HTML elements (`article`, `section`, `nav`, `main`).
- All interactive elements must have ARIA labels or accessible names.
- Custom hooks must start with `use` and live in `src/hooks/`.
- No inline styles. Use Tailwind utility classes or CSS modules.
- Co-locate component, test, and story files when possible.

#### Imports

Order (enforced by ESLint):

1. React / Next.js
2. Third-party libraries
3. Internal aliases (`@/components`, `@/lib`, `@/hooks`)
4. Relative imports (sibling/parent)
5. Type-only imports (using `import type`)
6. CSS / asset imports

```tsx
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api-client";
import { useDocumentUpload } from "@/hooks/useDocumentUpload";

import { formatCitation } from "./utils";

import type { Citation, DocumentResult } from "@/types";
```

### 4.2 Python (AI Service)

#### Language Version & Configuration

- **Python:** 3.12+. Use modern syntax: `match` statements, `type` aliases, `|` union syntax.
- **Type hints:** Required on all function signatures and class attributes. Use `from __future__ import annotations` in every file.
- **Pydantic v2:** All data models use Pydantic `BaseModel` with strict validation.

#### Formatting & Naming

| Element | Convention | Example |
|---|---|---|
| Files / modules | snake_case | `citation_extractor.py` |
| Packages | snake_case | `citepilot_ai` |
| Variables | snake_case | `citation_count` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_DOCUMENT_SIZE_BYTES` |
| Functions | snake_case | `extract_citations()` |
| Classes | PascalCase | `CitationMatcher` |
| Pydantic models | PascalCase + `Schema` suffix for API | `DocumentUploadSchema` |
| Private members | Leading underscore | `_parse_reference_block()` |
| Type aliases | PascalCase | `CitationStyle = Literal["apa7", "harvard"]` |
| Test functions | `test_` prefix, descriptive | `test_apa7_extracts_author_year_from_parenthetical()` |

#### Function Style

```python
from __future__ import annotations

from typing import Sequence

from citepilot_ai.api.schemas.citation import CitationResult, MatchConfidence


async def match_citations(
    in_text_citations: Sequence[ExtractedCitation],
    reference_entries: Sequence[ParsedReference],
    style: CitationStyle,
) -> list[CitationResult]:
    """Match extracted in-text citations against parsed reference entries.

    Uses fuzzy matching on author names and exact matching on years.
    Falls back to LLM-assisted matching when confidence is below threshold.

    Args:
        in_text_citations: Citations extracted from the document body.
        reference_entries: Parsed entries from the reference list(s).
        style: The detected or user-specified citation style.

    Returns:
        A list of match results with confidence scores and explanations.

    Raises:
        CitationProcessingError: If the LLM service is unavailable after retries.
    """
    results: list[CitationResult] = []
    # Implementation
    return results
```

Rules:
- All public functions must have Google-style docstrings with `Args`, `Returns`, and `Raises` sections.
- Use `async def` for I/O-bound functions (API calls, database, file reads).
- Use `Sequence` and `Mapping` for input parameters; `list` and `dict` for return types.
- No bare `except`. Always catch specific exception types.
- Use `structlog` for all logging (see Section 10).

---

## 5. Linting & Formatting Configuration

### 5.1 TypeScript: Typecheck + Tests (no ESLint config committed)

The repositories do **not** commit an ESLint or Prettier config, and `npm run lint` is **not** a CI gate (Next.js 16 removed `next lint`). Quality gates are:

- `npx tsc --noEmit` — strict typechecking gate.
- `vitest` unit/integration tests — must pass on every PR.
- Manual review per §7 (formatting and style are caught in review).

If the team later reintroduces linting, standardise one `eslint.config.*` (flat config, `typescript-eslint` strict + `react-hooks`) committed to `citepilot-web/` — and update this section and the CI workflow together.

### 5.2 Python: Ruff

**Ruff** (`citepilot-ai/ruff.toml`):

```toml
target-version = "py312"
line-length = 100
src = ["src", "tests"]

[lint]
select = [
  "E",     # pycodestyle errors
  "W",     # pycodestyle warnings
  "F",     # pyflakes
  "I",     # isort
  "N",     # pep8-naming
  "UP",    # pyupgrade
  "B",     # flake8-bugbear
  "SIM",   # flake8-simplify
  "C4",    # flake8-comprehensions
  "DTZ",   # flake8-datetimez
  "T20",   # flake8-print (no print statements)
  "RET",   # flake8-return
  "PTH",   # flake8-use-pathlib
  "ERA",   # eradicate (commented-out code)
  "RUF",   # ruff-specific rules
  "ASYNC", # flake8-async
  "S",     # flake8-bandit (security)
  "ANN",   # flake8-annotations
]
ignore = [
  "ANN101", # missing type annotation for self
  "ANN102", # missing type annotation for cls
  "S101",   # allow assert in tests
]

[lint.per-file-ignores]
"tests/**/*.py" = ["S101", "ANN"]

[lint.isort]
known-first-party = ["citepilot_ai"]

[format]
quote-style = "double"
indent-style = "space"
docstring-code-format = true
```

### 5.3 Pre-commit Hooks

All repositories use pre-commit to enforce formatting before code reaches CI:

```yaml
# .pre-commit-config.yaml (TypeScript repos)
repos:
  - repo: local
    hooks:
      - id: lint
        name: ESLint
        entry: npx eslint --fix --max-warnings 0
        language: system
        types: [typescript, tsx]
      - id: format
        name: Prettier
        entry: npx prettier --write
        language: system
        types_or: [typescript, tsx, json, css, markdown]
      - id: typecheck
        name: TypeScript
        entry: npx tsc --noEmit
        language: system
        pass_filenames: false
```

```yaml
# .pre-commit-config.yaml (Python repo)
repos:
  - repo: local
    hooks:
      - id: ruff-lint
        name: Ruff Lint
        entry: ruff check --fix
        language: system
        types: [python]
      - id: ruff-format
        name: Ruff Format
        entry: ruff format
        language: system
        types: [python]
      - id: mypy
        name: Mypy
        entry: mypy
        language: system
        types: [python]
        pass_filenames: false
```

---

## 6. Git Branching Strategy

### 6.1 Trunk-Based Development

CitePilot follows **trunk-based development** with short-lived feature branches.

```mermaid
gitGraph
    commit id: "v1.0.0"
    branch feature/upload-flow
    commit id: "feat: upload"
    commit id: "fix: validation"
    checkout main
    merge feature/upload-flow id: "squash merge"
    commit id: "v1.1.0"
    branch feature/retraction-check
    commit id: "feat: retraction"
    checkout main
    branch hotfix/auth-crash
    commit id: "fix: null token"
    checkout main
    merge hotfix/auth-crash id: "hotfix merge"
    merge feature/retraction-check id: "squash merge "
    commit id: "v1.2.0"
```

### 6.2 Branch Naming

| Branch Type | Pattern | Example | Max Lifetime |
|---|---|---|---|
| Feature | `feature/<ticket>-<description>` | `feature/CP-142-retraction-watch-api` | 3 days |
| Bugfix | `fix/<ticket>-<description>` | `fix/CP-208-apa7-et-al-threshold` | 2 days |
| Hotfix | `hotfix/<ticket>-<description>` | `hotfix/CP-301-auth-null-token` | 4 hours |
| Chore | `chore/<description>` | `chore/upgrade-openai-sdk` | 2 days |
| Release | `release/v<major>.<minor>` | `release/v1.2` | Until deployed |

Rules:
- `main` is the **only** long-lived branch.
- Feature branches must be rebased on `main` before merging.
- Maximum branch lifetime is **3 days**. If a feature takes longer, break it into smaller increments behind a feature flag.
- Stale branches (>5 days with no activity) are automatically deleted by CI.

### 6.3 Merge Strategy

- **Feature/fix branches → main:** Squash merge. One clean commit per feature.
- **Hotfix branches → main:** Standard merge commit (preserves audit trail).
- **Release branches → main:** Standard merge commit with tag.

---

## 7. PR & Code Review Process

### 7.1 Pull Request Requirements

Every PR must satisfy **all** of the following before merge:

| Requirement | Details |
|---|---|
| **CI Passes** | Lint, typecheck, unit tests, integration tests all green |
| **Minimum 1 Approval** | At least 1 approval from a code owner |
| **2 Approvals for Critical Paths** | Auth, billing, AI prompt changes, database migrations |
| **No Unresolved Conversations** | All review comments must be resolved |
| **Branch Up-to-Date** | Must be rebased on latest `main` |
| **PR Description Complete** | Uses the PR template (see below) |
| **No Draft PRs Merged** | Draft PRs cannot be merged |

### 7.2 PR Template

```markdown
## Summary
<!-- What does this PR do? Link the ticket. -->
Closes CP-XXX

## Type of Change
- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentation
- [ ] Infrastructure / CI

## Changes
<!-- Bullet list of what changed -->

## Testing
<!-- How was this tested? Include commands, screenshots, or test output -->

## Screenshots / Recordings
<!-- For UI changes, include before/after screenshots -->

## Checklist
- [ ] Self-reviewed the diff
- [ ] Added/updated tests
- [ ] Updated documentation if needed
- [ ] No new lint warnings
- [ ] Accessibility verified (for UI changes)
- [ ] Database migration is reversible (if applicable)
```

### 7.3 Code Review Guidelines

**For Reviewers:**
- Review within **4 business hours** of being assigned.
- Focus on correctness, security, performance, and maintainability — not style (automated tools handle style).
- Use GitHub suggestion blocks for small fixes.
- Prefix comments with intent: `nit:`, `question:`, `concern:`, `blocker:`.
- Approve with comments if only nits remain.

**For Authors:**
- Keep PRs under **400 lines** of meaningful changes (excluding generated files, lock files).
- Write a clear PR description — reviewers should understand the change without reading every line.
- Respond to all comments, even if just "Done" or "Won't fix because X".
- Do not merge your own PR unless you have 2+ approvals and are the on-call engineer deploying a hotfix.

### 7.4 Code Owners

```
# citepilot-web CODEOWNERS
src/app/api/           @citepilot/backend-team
src/components/        @citepilot/frontend-team
src/hooks/             @citepilot/frontend-team

# citepilot-gateway CODEOWNERS
src/modules/auth/      @citepilot/security-team @citepilot/backend-team
src/modules/billing/   @citepilot/backend-team
src/db/migrations/     @citepilot/backend-team @citepilot/dba

# citepilot-ai CODEOWNERS
src/citepilot_ai/llm/  @citepilot/ai-team
src/citepilot_ai/core/ @citepilot/ai-team
src/citepilot_ai/external/ @citepilot/backend-team
```

---

## 8. Commit Message Conventions

### 8.1 Conventional Commits

All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### 8.2 Types

| Type | When to Use |
|---|---|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, whitespace (no logic change) |
| `refactor` | Code restructuring without behavior change |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `build` | Build system, dependencies |
| `ci` | CI configuration |
| `chore` | Maintenance tasks |

### 8.3 Scopes

| Repository | Valid Scopes |
|---|---|
| `citepilot-web` | `ui`, `upload`, `results`, `auth`, `settings`, `a11y` |
| `citepilot-gateway` | `auth`, `billing`, `documents`, `queue`, `db`, `api` |
| `citepilot-ai` | `extraction`, `matching`, `validation`, `llm`, `parsers`, `crossref` |

### 8.4 Examples

```
feat(extraction): add IEEE numeric citation pattern recognition

fix(auth): prevent session fixation on OAuth callback redirect

perf(matching): cache Crossref responses for 24h to reduce API calls

refactor(ui): extract citation status badge into shared component

docs(api): add OpenAPI examples for /v1/documents endpoint

BREAKING CHANGE: rename /api/check to /api/v1/documents/analyze
```

### 8.5 Enforcement

Commit messages are validated by `commitlint` in a Git hook and in CI:

```json
// commitlint.config.js
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "scope-enum": [2, "always", ["ui", "upload", "results", "auth", "settings", "a11y",
      "billing", "documents", "queue", "db", "api",
      "extraction", "matching", "validation", "llm", "parsers", "crossref"]],
    "subject-max-length": [2, "always", 72],
    "body-max-line-length": [2, "always", 100]
  }
}
```

---

## 9. Naming Conventions

### 9.1 API Endpoints

RESTful conventions with plural nouns, no verbs in paths:

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/documents` | Upload a document for analysis |
| `GET` | `/api/v1/documents/:id` | Get document metadata |
| `GET` | `/api/v1/documents/:id/results` | Get analysis results |
| `POST` | `/api/v1/documents/:id/analyze` | Trigger analysis (action on resource) |
| `DELETE` | `/api/v1/documents/:id` | Delete a document |
| `GET` | `/api/v1/users/me` | Get current user profile |
| `PATCH` | `/api/v1/users/me/settings` | Update user settings |
| `GET` | `/api/v1/billing/subscription` | Get current subscription |
| `POST` | `/api/v1/billing/checkout` | Create Stripe checkout session |

Rules:
- All endpoints versioned under `/api/v1/`.
- Use kebab-case for multi-word path segments: `/api/v1/citation-styles`.
- Resource IDs use UUIDv7 (time-sortable): `01913a4f-6c2a-7b3e-8d1f-4a5b6c7d8e9f`.
- Query parameters use camelCase: `?pageSize=20&sortBy=createdAt`.
- Response envelope: `{ "data": {...}, "meta": { "requestId": "..." } }` for success.
- Error envelope: `{ "error": { "code": "DOCUMENT_TOO_LARGE", "message": "...", "details": [...] } }`.

### 9.2 Database Tables & Columns

PostgreSQL naming conventions:

| Element | Convention | Example |
|---|---|---|
| Tables | snake_case, plural | `documents`, `citation_results` |
| Columns | snake_case | `created_at`, `reference_count` |
| Primary keys | `id` (UUIDv7) | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` |
| Foreign keys | `<singular_table>_id` | `document_id`, `user_id` |
| Indexes | `idx_<table>_<columns>` | `idx_documents_user_id_created_at` |
| Unique constraints | `uq_<table>_<columns>` | `uq_users_email` |
| Check constraints | `ck_<table>_<column>` | `ck_documents_word_count_positive` |
| Enums | snake_case, singular | `citation_status`, `subscription_tier` |
| Timestamps | `_at` suffix, always UTC | `created_at`, `analyzed_at`, `expires_at` |
| Boolean columns | `is_` or `has_` prefix | `is_retracted`, `has_doi` |

### 9.3 Environment Variables

```
# Service identification
SERVICE_NAME=citepilot-gateway
SERVICE_ENV=production              # development | staging | production

# Database
DATABASE_URL=postgresql://user:pass@host:5432/citepilot
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# External APIs (secrets live in the platform dashboards — Railway/Vercel env vars)
GOOGLE_API_KEY=AIza...             # Gemini (citepilot-ai) — rotate every 90 days (ADR-008)
CROSSREF_MAILTO=api@citepilot.com

# Feature flags (gateway)
PAYWALL_ENABLED=true
SHOW_PAYWALL=true
```

Rules:
- Never commit secrets to Git. Use `.env.example` with placeholder values.
- All services read config via a validated config module (Pydantic Settings in Python, Zod schema in TypeScript) that fails fast on startup if required variables are missing.
- Prefix client-exposed variables with `NEXT_PUBLIC_` in the frontend.
- Production secrets live as environment variables in the **Vercel and Railway dashboards** — there is no AWS Secrets Manager (ADR-009).

---

## 10. Error Handling Patterns

### 10.1 TypeScript Error Hierarchy

```typescript
// src/lib/errors.ts

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, "AUTHENTICATION_REQUIRED", 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(message, "FORBIDDEN", 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, "NOT_FOUND", 404, { resource, id });
  }
}

export class RateLimitError extends AppError {
  constructor(public readonly retryAfterSeconds: number) {
    super("Rate limit exceeded", "RATE_LIMIT_EXCEEDED", 429, { retryAfterSeconds });
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: Error) {
    super(
      `External service unavailable: ${service}`,
      "EXTERNAL_SERVICE_ERROR",
      502,
      { service, originalMessage: originalError?.message },
    );
  }
}
```

### 10.2 Python Error Hierarchy

```python
# src/citepilot_ai/lib/errors.py

class CitePilotError(Exception):
    """Base exception for all CitePilot errors."""
    def __init__(self, message: str, code: str, status_code: int = 500) -> None:
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)

class DocumentParsingError(CitePilotError):
    def __init__(self, message: str, filename: str) -> None:
        super().__init__(message, "DOCUMENT_PARSING_ERROR", 422)
        self.filename = filename

class LLMServiceError(CitePilotError):
    def __init__(self, provider: str, original_error: Exception) -> None:
        super().__init__(
            f"LLM provider {provider} unavailable",
            "LLM_SERVICE_ERROR",
            503,
        )
        self.provider = provider
        self.original_error = original_error

class ExternalAPIError(CitePilotError):
    def __init__(self, service: str, status_code: int, response_body: str) -> None:
        super().__init__(
            f"External API error from {service}: HTTP {status_code}",
            "EXTERNAL_API_ERROR",
            502,
        )
        self.service = service
        self.upstream_status = status_code
        self.response_body = response_body

class QuotaExceededError(CitePilotError):
    def __init__(self, tier: str, limit_name: str, limit_value: int) -> None:
        super().__init__(
            f"{limit_name} limit of {limit_value} exceeded for {tier} tier",
            "QUOTA_EXCEEDED",
            429,
        )
```

### 10.3 Global Error Handling

**Gateway (Express middleware):**

```typescript
// src/middleware/error-handler.ts
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const requestId = req.headers["x-request-id"] as string;

  if (err instanceof AppError) {
    logger.warn("Application error", {
      requestId,
      code: err.code,
      statusCode: err.statusCode,
      message: err.message,
      path: req.path,
    });
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
      meta: { requestId },
    });
  }

  // Unexpected errors — log full stack, return generic message
  logger.error("Unhandled error", {
    requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
  });
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    meta: { requestId },
  });
}
```

**AI Service (FastAPI exception handler):**

```python
# src/citepilot_ai/main.py
@app.exception_handler(CitePilotError)
async def citepilot_error_handler(request: Request, exc: CitePilotError) -> JSONResponse:
    request_id = request.state.request_id
    logger.warning(
        "Application error",
        code=exc.code,
        status_code=exc.status_code,
        message=exc.message,
        request_id=request_id,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {"code": exc.code, "message": exc.message},
            "meta": {"requestId": request_id},
        },
    )
```

Rules:
- Never expose stack traces or internal details in production API responses.
- Always include `requestId` in error responses for support correlation.
- Log unexpected errors at `ERROR` level with full stack trace.
- Log expected/handled errors at `WARN` level without stack trace.
- Use circuit breakers (via `tenacity` in Python, custom wrapper in TypeScript) for all external API calls with exponential backoff.

---

## 11. Logging Standards

### 11.1 Format

All services emit **structured JSON logs** to stdout. Log aggregation is the platform-native log viewer (Vercel dashboard, Railway service logs) until an observability tool is adopted (roadmap — `04-engineering-standards/20-monitoring-observability.md`).

```json
{
  "timestamp": "2026-07-14T17:30:00.123Z",
  "level": "info",
  "service": "citepilot-gateway",
  "environment": "production",
  "requestId": "01913a4f-6c2a-7b3e-8d1f-4a5b6c7d8e9f",
  "userId": "usr_01913a4f",
  "message": "Document upload completed",
  "data": {
    "documentId": "doc_01913a50",
    "wordCount": 12450,
    "referenceCount": 87,
    "fileType": "docx",
    "processingTimeMs": 234
  }
}
```

### 11.2 Log Levels

| Level | When to Use | Example |
|---|---|---|
| `error` | Unhandled exceptions, data corruption, service outages | Database connection lost |
| `warn` | Handled errors, degraded service, approaching limits | Crossref API returned 429, using cached data |
| `info` | Significant business events, request lifecycle | Document uploaded, analysis complete, user subscribed |
| `debug` | Detailed diagnostic info, not enabled in production | LLM prompt/response content, intermediate match scores |

### 11.3 Correlation IDs

Every incoming request receives a UUIDv7 `requestId` assigned by the API gateway. This ID is:

1. Set as `x-request-id` header on the incoming request (or generated if absent).
2. Propagated to all downstream service calls via the same header.
3. Included in every log line emitted during that request's lifecycle.
4. Returned to the client in the response body's `meta.requestId` field.
5. Attached to downstream service calls (gateway proxying to the AI service) so the correlation chain survives. (The MVP is synchronous — no job queues exist; ADR-011.)

### 11.4 What to Log / What Not to Log

**Always log:**
- Request start and completion with latency
- Authentication success/failure
- External API calls (service, method, latency, status code)
- Queue job enqueue, start, complete, fail
- Business events (upload, analysis, subscription change)

**Never log:**
- Passwords, tokens, API keys, or secrets (even partially)
- Full document content (PII risk)
- Credit card numbers or payment details
- Full LLM prompt/response content in production (token cost + PII)

### 11.5 Libraries

| Service | Library | Configuration |
|---|---|---|
| `citepilot-web` | `pino` | JSON output, request context via Next.js middleware |
| `citepilot-gateway` | `pino` + `pino-http` | Automatic request logging, redaction of sensitive headers |
| `citepilot-ai` | `structlog` | Processor chain: add timestamp → add service info → add request context → render JSON |

---

## 12. Dependency Management

### 12.1 TypeScript Repositories

- **Package manager:** pnpm (lockfile: `pnpm-lock.yaml`).
- **Node.js version:** Pinned in `.nvmrc` → `22.4.0`.
- **Dependency updates:** Renovate Bot runs weekly, auto-merges patch updates that pass CI, creates PRs for minor/major.
- **Security:** `pnpm audit` runs in CI on every PR. Any `critical` or `high` severity vulnerability blocks merge.

### 12.2 Python Repository

- **Package manager:** uv (lockfile: `uv.lock`).
- **Python version:** Pinned in `.python-version` → `3.12.4`.
- **Dependency updates:** Renovate Bot runs weekly with the same rules as TypeScript repos.
- **Security:** `pip-audit` runs in CI. Critical vulnerabilities block merge.
- **Pinning:** All dependencies pinned to exact versions in `uv.lock`. `pyproject.toml` uses compatible release specifiers (`~=`) for direct dependencies.

### 12.3 Rules

- No `dependencies` in `devDependencies` or vice versa.
- Justify every new dependency in the PR description. Prefer stdlib or existing dependencies over adding new ones.
- Evaluate bundle size impact for frontend dependencies using `bundlephobia` before adding.
- Maximum 1 library per concern (e.g., one HTTP client, one date library, one state manager).

---

## 13. Code Documentation Standards

### 13.1 What to Document

| What | Where | Format |
|---|---|---|
| Public API endpoints | OpenAPI spec (auto-generated from code) | Swagger/ReDoc |
| Complex business logic | Inline comments explaining "why", not "what" | Code comments |
| Public functions/methods | JSDoc (TypeScript) or Google-style docstrings (Python) | Function-level docs |
| Architecture decisions | ADR documents (see doc #18) | Markdown in `/docs/adr/` |
| Runbooks | `/docs/runbooks/` | Markdown |
| Environment setup | `README.md` in each repo | Markdown |
| Database schema | Migrations + ERD diagram | SQL + Mermaid |

### 13.2 README Template

Every repository must have a README with these sections:

1. **Overview** — What this service does, one paragraph.
2. **Architecture** — Where this service fits in the system, with diagram.
3. **Prerequisites** — Required tools and versions.
4. **Getting Started** — Step-by-step local setup, from clone to running.
5. **Environment Variables** — Table of all required env vars with descriptions and example values.
6. **Development** — How to run tests, lint, format, and build.
7. **Deployment** — How deployments work (CI/CD pipeline overview).
8. **API Documentation** — Link to OpenAPI docs (for backend services).
9. **Contributing** — Link to this engineering guidelines document.

### 13.3 Inline Documentation Rules

```typescript
// ✅ Good: explains WHY, not WHAT
// We re-sort results after LLM matching because the LLM may return
// results in a different order than the input citations, and the
// frontend expects results ordered by document position.
results.sort((a, b) => a.position - b.position);

// ❌ Bad: restates the code
// Sort results by position
results.sort((a, b) => a.position - b.position);
```

```python
# ✅ Good: documents a non-obvious constraint
# Crossref rate limits to 50 req/s with polite pool (mailto header).
# We batch lookups in groups of 20 with 500ms delays to stay well
# under the limit and avoid 429s during peak usage.
CROSSREF_BATCH_SIZE = 20
CROSSREF_BATCH_DELAY_SECONDS = 0.5
```

---

## 14. Security Standards

### 14.1 Authentication & Authorization

- The MVP is **sessionless** — there is no login flow (ADR-011). The product surface is: static marketing pages + the analysis dashboard.
- The gateway may carry auth provisions (e.g. `JWT_SECRET` env var, `users`/`sessions` tables) as groundwork — they are NOT exercised by the MVP frontend.
- Any future auth feature ships behind its own ADR (per ADR-011's sessionless decision).

### 14.2 Input Validation

- All incoming request bodies validated via Zod (TypeScript) or Pydantic (Python) before any processing.
- File uploads validated: allowed types (`.docx`, `.pdf`, `.txt`, `.rtf`, `.bib`), max size (50 MB), and content sniffing (magic bytes) server-side.
- SQL injection prevented by ORM (Drizzle) — no raw SQL queries without parameterized inputs.
- XSS prevented by React's default escaping + appropriate security headers.

### 14.3 Data Handling

- Documents are held in memory during the audit only and hard-deleted after ≤ 36 hours (`expires_at` + cleanup, ADR-005). No object storage.
- All transport is HTTPS/TLS 1.2+ (platform-managed certificates, ADR-009).
- Secrets are platform env vars, rotated per `06-operations/25-runbooks.md` Runbook 5.

---

## 15. Performance Standards

### 15.1 Frontend

| Metric | Target |
|---|---|
| Largest Contentful Paint (LCP) | < 2.5s |
| First Input Delay (FID) | < 100ms |
| Cumulative Layout Shift (CLS) | < 0.1 |
| Time to Interactive (TTI) | < 3.5s |
| JavaScript bundle (main) | < 200KB gzipped |
| Lighthouse Performance score | ≥ 90 |

### 15.2 API

| Metric | Target |
|---|---|
| P50 response time (non-AI) | < 100ms |
| P95 response time (non-AI) | < 300ms |
| P99 response time (non-AI) | < 1s |
| Document upload + parse | < 3s for 20,000 words |
| Full citation check (AI) | 5–15 s for short docs; 15–45 s for 5–20k words; 2–3 min thesis-length (per `14-ai-nlp-design.md` §8) |
| Availability | 99.9% uptime (8.76h downtime/year) |

---

## 16. Definition of Done

A feature is "done" when:

- [ ] Code written, following all conventions in this document
- [ ] Unit tests written and passing (≥80% coverage for new code)
- [ ] Integration tests written for new API endpoints
- [ ] E2E test written for new user-facing flows
- [ ] Accessibility audited (axe-core passes, keyboard navigation verified)
- [ ] PR reviewed and approved
- [ ] Documentation updated (API docs, README, runbook if applicable)
- [ ] Feature flag configured (if gradual rollout)
- [ ] Monitoring: relevant metrics/alerts added
- [ ] Deployed to staging and smoke-tested
- [ ] Product owner has verified acceptance criteria

---

*This is a living document. Propose changes via PR to the `docs` repository with the `docs` commit scope.*
