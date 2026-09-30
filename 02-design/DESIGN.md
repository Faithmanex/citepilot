# CitePilot Design System & Specification (`DESIGN.md`)

This document defines the complete Design System, Visual Aesthetics, Component Specifications, and Interaction Architecture for **CitePilot**, synthesized directly from the design blueprints in [`citepilot-v2.html`](file:///C:/Users/DELL%20XPS%209360/Documents/GitHub/CitePilot%20-%20Deepseek/02-design/citepilot-v2.html) and [`citepilot-dashboard.html`](file:///C:/Users/DELL%20XPS%209360/Documents/GitHub/CitePilot%20-%20Deepseek/02-design/citepilot-dashboard.html).

---

## 🎨 1. Design Aesthetics & Visual Philosophy

CitePilot bridges the timeless aesthetic of **traditional editorial proofreading** with the efficiency of **modern academic SaaS interfaces**:

1. **Paper & Ink Palette**: Replaces sterile web-white with tactile, warm paper tones (`#F1EBDC` / `#FAF6EC`) and deep carbon ink (`#221D16`), evoking academic manuscripts, press proofs, and library archives.
2. **Editorial Stamp & Margin Annotations**: Uses rotated double-bordered rubber stamp badges (`VERIFIED`, `MISMATCH`, `UNCITED`) and handwritten cursive margin annotations (`Caveat`) for intuitive proofreading feedback.
3. **High-Contrast Issue Color System**:
   - 🔴 **Error / Mismatch (`#A32B21`)**: Mismatched citations, missing bibliography entries, and retracted papers.
   - 🟠 **Warning / Discrepancy (`#93650F`)**: Style manual rule violations, year mismatches, and uncited factual claims.
   - 🟢 **Verified Match (`#3B6647`)**: Exact citation-reference matches and Crossref-verified metadata.
   - 🔵 **Academic Brand Accent (`#2C3E8C`)**: Interactive buttons, active tabs, and primary action controls.

---

## 📐 2. Brand Design Tokens (Single Source of Truth)

These tokens are the **canonical CitePilot brand standard**. The runtime source of truth is [`citepilot-web/src/app/globals.css`](../citepilot-web/src/app/globals.css) (`@theme`); this section must be kept in sync with it. Both the landing page and the app dashboard use the **same** paper/ink system.

### A. Editorial Core (Paper & Ink)

| Token (`globals.css`) | Value | Role |
|---|---|---|
| `--color-paper` | `#F1EBDC` | Warm aged paper — page background |
| `--color-paper-card` / `--color-cloud` | `#FAF6EC` | Card surfaces and manuscript container |
| `--color-card` | `#FFFFFF` | Raised white panels |
| `--color-ink-black` / `--color-ink` | `#221D16` | Primary carbon ink (body text) |
| `--color-ink-soft` | `#5C5344` | Secondary subdued text |
| `--color-ink-faint` | `#948A76` | Faint annotations, captions |
| `--color-rule` / `--color-line` | `#D9CFB8` | Paper grid and divider lines |
| `--color-brand` | `#2C3E8C` | Academic indigo accent (primary actions, links, focus) |
| `--color-brand-hover` | `#24357A` | Accent hover |
| `--color-brand-bg` | `#E7E9F5` | Accent tint |
| `--color-focus-ring` | `#2C3E8C` | Focus outline |

### B. Functional Status

| Token (`globals.css`) | Value | Role |
|---|---|---|
| `--color-verified` / `--color-status-verified` | `#3B6647` | Verified / matched citation (green) |
| `--color-verified-bg` | `#DEE8DD` | Verified highlight |
| `--color-warning` / `--color-status-warning` | `#93650F` | Style warning / uncited claim (ochre) |
| `--color-warning-bg` | `#F1E4C8` | Warning highlight |
| `--color-error` / `--color-status-error` | `#A32B21` | Mismatch / retraction (red) |
| `--color-error-bg` | `#F3DCD6` | Error highlight |

### C. App Chrome (Sidebar)

| Token (`globals.css`) | Value | Role |
|---|---|---|
| `--color-sidebar` | `#14181F` | Dark charcoal navigation sidebar |
| `--color-sidebar-line` | `#252B36` | Sidebar group dividers |
| `--color-sidebar-text` | `#9CA3B0` | Sidebar item text |
| `--color-sidebar-text-active` | `#FAFAF7` | Active nav text |

Border radius is standardized to **8px** (`--radius-sm` … `--radius-full`), and elevation is flat with **zero drop shadows**; both are defined in `globals.css`.

---

## 🔤 3. Typography Hierarchy

CitePilot pairs three distinct font families to serve specific roles:

| Font Family | Usage Role | Examples |
|---|---|---|
| **`Courier Prime`** / **`JetBrains Mono`** | Typewriter manuscript text, code metrics, bracketed eyebrows, raw reference code. | `[ VERIFIED ]`, `Smith (2020)`, `10.1016/j.jis.2019.02.005` |
| **`Caveat`** | Handwritten margin notes, editor corrections, annotations. | *"Check spelling in bibliography!"*, *"Missing page number"* |
| **`Inter`** / **`Manrope`** | Primary UI controls, headers, buttons, navigation items, tooltips. | `Run Audit`, `APA 7th Edition`, `Dismiss Suggestion` |

---

## 🧩 4. Core UI Components

### A. Editorial Rubber Stamps (`.stamp`)
Circular, double-bordered rotated badges mimicking physical editorial press stamps:
```html
<div class="stamp red">MISMATCH DETECTED</div>
<div class="stamp green">100% VERIFIED</div>
<div class="stamp ochre">STYLE WARNING</div>
```

### B. Manuscript Text Highlights (`.mk`)
Inline text markup tags reflecting audit findings:
- **Red Wavy Underline (`.mk.red`)**: Mismatched in-text citations or retracted papers.
- **Green Box Fill (`.mk.green`)**: Verified citation-reference exact matches.
- **Ochre Bottom Border (`.mk.ochre`)**: Style manual rule warnings (e.g. ampersand in heading, *et al.* errors).

### C. Sidebar Navigation Grouping (`.sidebar`)
Structured navigation layout divided into functional groups:
1. **AUDIT & VERIFICATION**: *Full Document Audit*, *Reference List Only*, *Uncited Claims (AI)*.
2. **DATABASE & INTELLIGENCE**: *Retraction Inspector*, *Crossref Verifier*, *Recency Distribution*.
3. **STRUCTURE & EXPORT**: *Layout & Formatting*, *Export Report (PDF/DOCX)*.

### D. Dismissible Issue Card Component
Cards featuring a direct **"Dismiss / Ignore"** action button, allowing users to silence intentional exceptions or false positives:
```html
<div class="issue-card warning">
  <div class="issue-badge">STYLE_WARNING</div>
  <div class="issue-title">Heading Ampersand Usage</div>
  <p class="issue-desc">Heading 'Conclusion & Recommendations' uses an ampersand. In APA 7, use 'and' in main headings.</p>
  <button class="btn-dismiss" onclick="dismissIssue('id')">Dismiss / Ignore</button>
</div>
```

---

## 🖥️ 5. Dashboard View Specifications

The app architecture in `citepilot-dashboard.html` defines 8 modular view panels:

1. **Panel 1: Full Document Audit View**:
   - Left: Split-view manuscript text preview with inline highlighted citation chips.
   - Right: Issues sidebar drawer categorizing Red, Orange, and Green findings.
2. **Panel 2: Reference List Only Mode**:
   - Accepts standalone bibliography uploads; checks syntax, DOIs, and Crossref metadata without body text.
3. **Panel 3: Uncited Claims AI Scanner**:
   - AI scanner highlighting factual/statistical assertions lacking citation markers.
4. **Panel 4: Retraction Inspector**:
   - Dedicated table of references flagged as retracted via Crossref `is-retracted-by` metadata.
5. **Panel 5: Crossref Metadata Verifier**:
   - Field-by-field verification grid (Title, Authors, Year, Journal, Volume, Issue, Pages) for **all citation styles**.
6. **Panel 6: Recency Distribution View**:
   - Source publication year breakdown (% of sources published in last 3, 5, 10 years vs older) with heuristic-based guidance.
7. **Panel 7: Document Layout & Structure Audit**:
   - Distinct section for heading levels, margins, line spacing, font styles, and TOC generation.
8. **Panel 8: Diagnostic Report Export**:
   - Export configuration for PDF Diagnostic Reports and annotated `.docx` manuscripts (highlights & comments).

---

## 📁 6. Included Design Code Files

The source HTML design blueprints are stored directly in the repository:
- [`02-design/citepilot-v2.html`](file:///C:/Users/DELL%20XPS%209360/Documents/GitHub/CitePilot%20-%20Deepseek/02-design/citepilot-v2.html): Editorial Landing Page & Tactile Paper Design System.
- [`02-design/citepilot-dashboard.html`](file:///C:/Users/DELL%20XPS%209360/Documents/GitHub/CitePilot%20-%20Deepseek/02-design/citepilot-dashboard.html): Complete App Workspace Dashboard & 8-Panel Layout.
- `citepilot-web/` (Next.js): interactive implementation. The earlier standalone `citepilot-web/index.html` prototype was removed in 2026-08; use the live app routes instead.
