# CitePilot Design System & Specification (`DESIGN.md`)

This document defines the complete Design System, Visual Aesthetics, Component Specifications, and Interaction Architecture for **CitePilot**, synthesized directly from the design blueprints in [`citepilot-v2.html`](file:///C:/Users/DELL%20XPS%209360/Documents/GitHub/CitePilot%20-%20Deepseek/02-design/citepilot-v2.html) and [`citepilot-dashboard.html`](file:///C:/Users/DELL%20XPS%209360/Documents/GitHub/CitePilot%20-%20Deepseek/02-design/citepilot-dashboard.html).

---

## 🎨 1. Design Aesthetics & Visual Philosophy

CitePilot bridges the timeless aesthetic of **traditional editorial proofreading** with the efficiency of **modern academic SaaS interfaces**:

1. **Paper & Ink Palette**: Replaces sterile web-white with tactile, warm paper tones (`#F1EBDC` / `#FAF6EC`) and deep carbon ink (`#221D16`), evoking academic manuscripts, press proofs, and library archives.
2. **Editorial Stamp & Margin Annotations**: Uses rotated double-bordered rubber stamp badges (`VERIFIED`, `MISMATCH`, `UNCITED`) and handwritten cursive margin annotations (`Caveat`) for intuitive proofreading feedback.
3. **High-Contrast Issue Color System**:
   - 🔴 **Error / Mismatch (`#A32B21` / `#B23A2E`)**: Mismatched citations, missing bibliography entries, and retracted papers.
   - 🟠 **Warning / Discrepancy (`#93650F` / `#B4740E`)**: Style manual rule violations, year mismatches, and uncited factual claims.
   - 🟢 **Verified Match (`#3B6647` / `#2F6F5E`)**: Exact citation-reference matches and Crossref-verified metadata.
   - 🔵 **Academic Brand Accent (`#2C3E8C` / `#6366F1`)**: Interactive buttons, active tabs, and primary action controls.

---

## 📐 2. Design Tokens & CSS Variables

### A. Editorial / Landing Design System (`citepilot-v2.html`)
```css
:root {
  --paper:        #F1EBDC; /* Warm aged paper background */
  --paper-card:   #FAF6EC; /* Card surfaces and manuscript container */
  --ink:          #221D16; /* Primary dark carbon ink */
  --ink-soft:     #5C5344; /* Secondary subdued text */
  --ink-faint:    #948A76; /* Faint annotations, borders, captions */
  --rule:         #D9CFB8; /* Paper grid and section divider lines */
  --red:          #A32B21; /* Citation mismatch & retraction red */
  --red-bg:       #F3DCD6; /* Red highlight background */
  --ochre:        #93650F; /* Style warning ochre */
  --ochre-bg:     #F1E4C8; /* Ochre highlight background */
  --green:        #3B6647; /* Verified match green */
  --green-bg:     #DEE8DD; /* Green highlight background */
}
```

### B. App Dashboard Design System (`citepilot-dashboard.html`)
```css
:root {
  --sidebar:              #14181F; /* Dark charcoal navigation sidebar */
  --sidebar-line:         #252B36; /* Sidebar group dividers */
  --sidebar-text:         #9CA3B0; /* Sidebar item text */
  --sidebar-text-active:  #FAFAF7; /* Active nav text */
  --paper:                #F4F3EE; /* Main canvas background */
  --card:                 #FFFFFF; /* White panel cards */
  --ink:                  #14181F; /* Main body text */
  --ink-soft:             #4A5160; /* Muted text */
  --ink-faint:            #8A8F99; /* Subtext */
  --line:                 #E4E2D8; /* Divider lines */
  --verified:             #2F6F5E; /* Emerald verified green */
  --verified-bg:          #E7F0EC; /* Light green chip background */
  --warning:              #B4740E; /* Amber warning ochre */
  --warning-bg:           #F6EEDD; /* Light amber chip background */
  --error:                #B23A2E; /* Crimson error red */
  --error-bg:             #F5E7E3; /* Light red chip background */
  --brand:                #2C3E8C; /* Academic navy/indigo accent */
  --brand-bg:             #E7E9F5; /* Light indigo pill background */
  --radius:               6px;
}
```

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
4. **Panel 4: Retraction Watch Inspector**:
   - Dedicated table of references checked against Retraction Watch / Crossref `is-retracted-by` data.
5. **Panel 5: Crossref Metadata Verifier**:
   - Field-by-field verification grid (Title, Authors, Year, Journal, Volume, Issue, Pages) for **all citation styles**.
6. **Panel 6: Recency Distribution View**:
   - Publication year breakdown chart (% of sources published in last 3, 5, 10 years vs older) with compliance badges.
7. **Panel 7: Document Layout & Structure Audit**:
   - Distinct section for heading levels, margins, line spacing, font styles, and TOC generation.
8. **Panel 8: Diagnostic Report Export**:
   - Export configuration for PDF Diagnostic Reports & Redline `.docx` Tracked Changes documents.

---

## 📁 6. Included Design Code Files

The source HTML design blueprints are stored directly in the repository:
- [`02-design/citepilot-v2.html`](file:///C:/Users/DELL%20XPS%209360/Documents/GitHub/CitePilot%20-%20Deepseek/02-design/citepilot-v2.html): Editorial Landing Page & Tactile Paper Design System.
- [`02-design/citepilot-dashboard.html`](file:///C:/Users/DELL%20XPS%209360/Documents/GitHub/CitePilot%20-%20Deepseek/02-design/citepilot-dashboard.html): Complete App Workspace Dashboard & 8-Panel Layout.
- [`citepilot-web/index.html`](file:///C:/Users/DELL%20XPS%209360/Documents/GitHub/CitePilot%20-%20Deepseek/citepilot-web/index.html): Interactive Web Application implementation connecting to the FastAPI backend API.
