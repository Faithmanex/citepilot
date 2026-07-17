# CitePilot Design System Specification

**Version:** 1.0.0
**Last Updated:** 2026-07-14
**Status:** Production-Ready
**Audience:** Frontend Engineers, UI/UX Designers, QA

---

## 1. Brand Identity

### 1.1 Brand Name

**CitePilot** — a compound of "Cite" (citation) and "Pilot" (guide/navigator). The name communicates intelligent navigation through the complexity of academic citations.

### 1.2 Brand Personality

| Trait         | Expression                                                                 |
|---------------|----------------------------------------------------------------------------|
| Intelligent   | AI-powered precision, confidence in results, data-driven feedback          |
| Trustworthy   | Academic rigour, transparent scoring, verifiable external source lookups    |
| Approachable  | Friendly language, clear explanations, no jargon walls                     |
| Efficient     | Fast results, clean layouts, minimal clicks to value                       |
| Professional  | Publication-grade output, institutional credibility, polished aesthetics   |

### 1.3 Logo Concepts

Three conceptual directions for the CitePilot logomark:

**Concept A — Citation Compass**
A minimal compass rose where the north needle is stylised as a quotation mark (`"`). The circular outline doubles as a magnifying glass handle at the bottom-right, suggesting search and navigation. Rendered in the primary indigo palette. Best used as a square icon/favicon.

**Concept B — Checkmark Bracket**
A square bracket `[` combined with a checkmark `✓` forming a single glyph — the bracket opens left and the checkmark extends from its midpoint. Communicates "citation verified." Clean geometric construction on a 24×24 grid. Pairs with the wordmark "CitePilot" in Inter SemiBold.

**Concept C — Flight Path Document**
A minimal document icon (rounded rectangle) with a curved flight-path arc sweeping from the bottom-left corner to the top-right, ending in a small arrow tip. The arc passes through three small dots representing citation checkpoints. Suggests the "pilot" navigating through a document.

**Recommended:** Concept B (Checkmark Bracket) — strongest at small sizes, most legible as a favicon, clearest semantic connection to citation verification.

### 1.4 Logo Usage

| Context                  | Format            | Min Size  | Clear Space     |
|--------------------------|--------------------|-----------|-----------------|
| Favicon                  | Logomark only      | 16×16 px  | N/A             |
| Mobile nav bar           | Logomark only      | 32×32 px  | 8 px all sides  |
| Desktop nav bar          | Logomark + wordmark| 140×32 px | 16 px all sides |
| Marketing / hero         | Full lockup        | 200×48 px | 24 px all sides |
| Email header             | Logomark + wordmark| 160×36 px | 12 px all sides |

Clear space is measured as 1× the height of the bracket glyph in the logomark.

### 1.5 Wordmark Typography

The wordmark "CitePilot" is set in **Inter SemiBold** at a tracking of `-0.02em`. "Cite" is rendered in `--color-primary-600` and "Pilot" in `--color-neutral-900` (light mode) or `--color-neutral-50` (dark mode).

---

## 2. Colour System

### 2.1 Primary Palette

The primary colour is a deep indigo, chosen for its association with intellect and trust in academic contexts, with sufficient contrast against white for WCAG AA compliance.

| Token                    | Hex       | Usage                                          |
|--------------------------|-----------|-------------------------------------------------|
| `--color-primary-50`     | `#EEF2FF` | Primary tinted backgrounds                      |
| `--color-primary-100`    | `#E0E7FF` | Hover backgrounds on primary surfaces            |
| `--color-primary-200`    | `#C7D2FE` | Focus rings, light borders                       |
| `--color-primary-300`    | `#A5B4FC` | Decorative accents                               |
| `--color-primary-400`    | `#818CF8` | Interactive secondary elements                   |
| `--color-primary-500`    | `#6366F1` | Primary brand colour, buttons, links             |
| `--color-primary-600`    | `#4F46E5` | Primary button default, logo "Cite" colour       |
| `--color-primary-700`    | `#4338CA` | Primary button hover                             |
| `--color-primary-800`    | `#3730A3` | Primary button active / pressed                  |
| `--color-primary-900`    | `#312E81` | High-contrast text on primary backgrounds        |
| `--color-primary-950`    | `#1E1B4B` | Dark mode primary surfaces                       |

### 2.2 Neutral Palette

| Token                    | Hex       | Usage                                          |
|--------------------------|-----------|-------------------------------------------------|
| `--color-neutral-0`      | `#FFFFFF` | Page background (light mode)                     |
| `--color-neutral-25`     | `#FCFCFD` | Subtle raised surfaces                           |
| `--color-neutral-50`     | `#F9FAFB` | Card backgrounds, input backgrounds              |
| `--color-neutral-100`    | `#F3F4F6` | Dividers, section backgrounds                    |
| `--color-neutral-200`    | `#E5E7EB` | Borders, separators                              |
| `--color-neutral-300`    | `#D1D5DB` | Disabled text, placeholder text                  |
| `--color-neutral-400`    | `#9CA3AF` | Muted icons, secondary labels                    |
| `--color-neutral-500`    | `#6B7280` | Body text (secondary)                            |
| `--color-neutral-600`    | `#4B5563` | Body text (primary)                              |
| `--color-neutral-700`    | `#374151` | Headings, strong labels                          |
| `--color-neutral-800`    | `#1F2937` | High-emphasis text                               |
| `--color-neutral-900`    | `#111827` | Maximum contrast text, logo "Pilot" colour       |
| `--color-neutral-950`    | `#030712` | Dark mode page background                        |

### 2.3 Semantic Colours — Citation Status

These colours are the core visual language for citation checking results. Every shade has been validated against both white and dark backgrounds for WCAG AA (4.5:1 text, 3:1 UI components).

#### Success / Matched (Green)

| Token                    | Hex       | Contrast on White | Usage                             |
|--------------------------|-----------|--------------------|-----------------------------------|
| `--color-success-50`     | `#F0FDF4` | —                  | Matched citation row background    |
| `--color-success-100`    | `#DCFCE7` | —                  | Matched highlight strip            |
| `--color-success-200`    | `#BBF7D0` | —                  | Badge background                   |
| `--color-success-500`    | `#22C55E` | 3.0:1 (UI only)   | Icon fills, progress segments      |
| `--color-success-600`    | `#16A34A` | 4.6:1 ✓           | Badge text, status labels          |
| `--color-success-700`    | `#15803D` | 5.9:1 ✓           | Inline text annotations            |
| `--color-success-800`    | `#166534` | 8.1:1 ✓           | High-contrast status text          |

#### Warning / Possible Match (Amber)

| Token                    | Hex       | Contrast on White | Usage                             |
|--------------------------|-----------|--------------------|-----------------------------------|
| `--color-warning-50`     | `#FFFBEB` | —                  | Warning citation row background    |
| `--color-warning-100`    | `#FEF3C7` | —                  | Warning highlight strip            |
| `--color-warning-200`    | `#FDE68A` | —                  | Badge background                   |
| `--color-warning-500`    | `#F59E0B` | 2.8:1 (UI only)   | Icon fills                         |
| `--color-warning-600`    | `#D97706` | 3.6:1 (UI only)   | Badge icons                        |
| `--color-warning-700`    | `#B45309` | 4.8:1 ✓           | Badge text, status labels          |
| `--color-warning-800`    | `#92400E` | 6.4:1 ✓           | High-contrast status text          |

#### Error / No Match (Red)

| Token                    | Hex       | Contrast on White | Usage                             |
|--------------------------|-----------|--------------------|-----------------------------------|
| `--color-error-50`       | `#FEF2F2` | —                  | Error citation row background      |
| `--color-error-100`      | `#FEE2E2` | —                  | Error highlight strip              |
| `--color-error-200`      | `#FECACA` | —                  | Badge background                   |
| `--color-error-500`      | `#EF4444` | 3.9:1 (UI only)   | Icon fills, destructive icons      |
| `--color-error-600`      | `#DC2626` | 4.6:1 ✓           | Error text, destructive buttons    |
| `--color-error-700`      | `#B91C1C` | 5.7:1 ✓           | Badge text, status labels          |
| `--color-error-800`      | `#991B1B` | 7.3:1 ✓           | High-contrast error text           |

#### Info / Informational (Blue)

| Token                    | Hex       | Contrast on White | Usage                             |
|--------------------------|-----------|--------------------|-----------------------------------|
| `--color-info-50`        | `#EFF6FF` | —                  | Info banner background             |
| `--color-info-100`       | `#DBEAFE` | —                  | Info highlight strip               |
| `--color-info-200`       | `#BFDBFE` | —                  | Badge background                   |
| `--color-info-500`       | `#3B82F6` | 3.1:1 (UI only)   | Icon fills, info icons             |
| `--color-info-600`       | `#2563EB` | 4.6:1 ✓           | Link text, info labels             |
| `--color-info-700`       | `#1D4ED8` | 6.0:1 ✓           | Badge text                         |
| `--color-info-800`       | `#1E40AF` | 7.8:1 ✓           | High-contrast info text            |

### 2.4 Extended Semantic Colours

| Token                        | Hex       | Usage                                       |
|------------------------------|-----------|----------------------------------------------|
| `--color-retracted`          | `#7C3AED` | Retracted source indicators (violet)         |
| `--color-hallucinated`       | `#EC4899` | AI-hallucinated citation flags (pink)        |
| `--color-crossref-verified`  | `#0891B2` | Crossref-verified badge (cyan)               |

### 2.5 Background & Surface Tokens

| Token                        | Light Mode | Dark Mode  |
|------------------------------|------------|------------|
| `--bg-page`                  | `#FFFFFF`  | `#0F1117`  |
| `--bg-surface`               | `#FFFFFF`  | `#1A1D2E`  |
| `--bg-surface-raised`        | `#F9FAFB`  | `#232738`  |
| `--bg-surface-overlay`       | `#FFFFFF`  | `#2A2E42`  |
| `--bg-surface-sunken`        | `#F3F4F6`  | `#13151F`  |
| `--border-default`           | `#E5E7EB`  | `#2E3348`  |
| `--border-strong`            | `#D1D5DB`  | `#3D4260`  |
| `--text-primary`             | `#111827`  | `#F9FAFB`  |
| `--text-secondary`           | `#4B5563`  | `#9CA3AF`  |
| `--text-tertiary`            | `#6B7280`  | `#6B7280`  |
| `--text-disabled`            | `#9CA3AF`  | `#4B5563`  |
| `--text-on-primary`          | `#FFFFFF`  | `#FFFFFF`  |
| `--text-link`                | `#4F46E5`  | `#818CF8`  |

---

## 3. Typography

### 3.1 Font Families

| Token                  | Family                          | Fallback Stack                                       | Usage                                 |
|------------------------|---------------------------------|------------------------------------------------------|---------------------------------------|
| `--font-sans`          | Inter                           | `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | All UI text                          |
| `--font-mono`          | JetBrains Mono                  | `'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace`    | Code, citation formatting, reference entries |

**Loading strategy:** Inter and JetBrains Mono are loaded via `next/font/google` in Next.js 15, with `font-display: swap` and `preload: true` for the Latin subset. Variable font files are used for both families to minimise payload (Inter Variable: ~100 KB, JetBrains Mono Variable: ~85 KB).

### 3.2 Type Scale

Base size: `16px` (1rem). Scale ratio: `1.250` (Major Third).

| Token              | Size (rem) | Size (px) | Line Height | Letter Spacing | Weight     | Usage                          |
|--------------------|------------|-----------|-------------|----------------|------------|--------------------------------|
| `--text-xs`        | 0.75       | 12        | 1.5 (18px)  | `0.02em`       | 400        | Micro labels, helper text       |
| `--text-sm`        | 0.875      | 14        | 1.43 (20px) | `0.01em`       | 400        | Table cells, captions, badges   |
| `--text-base`      | 1.0        | 16        | 1.5 (24px)  | `0em`          | 400        | Body text, input values          |
| `--text-lg`        | 1.125      | 18        | 1.56 (28px) | `-0.01em`      | 400        | Lead paragraphs, card titles     |
| `--text-xl`        | 1.25       | 20        | 1.4 (28px)  | `-0.01em`      | 600        | Section headings                 |
| `--text-2xl`       | 1.5        | 24        | 1.33 (32px) | `-0.02em`      | 600        | Page titles, modal headings      |
| `--text-3xl`       | 1.875      | 30        | 1.27 (38px) | `-0.02em`      | 700        | Hero sub-headings                |
| `--text-4xl`       | 2.25       | 36        | 1.22 (44px) | `-0.03em`      | 700        | Hero headings                    |
| `--text-5xl`       | 3.0        | 48        | 1.17 (56px) | `-0.03em`      | 800        | Landing page hero only           |

### 3.3 Font Weight Tokens

| Token                  | Weight | Usage                                    |
|------------------------|--------|------------------------------------------|
| `--font-regular`       | 400    | Body text, descriptions                   |
| `--font-medium`        | 500    | Labels, nav items, table headers          |
| `--font-semibold`      | 600    | Headings, button labels, strong emphasis  |
| `--font-bold`          | 700    | Hero text, marketing headings             |
| `--font-extrabold`     | 800    | Landing page hero only                    |

### 3.4 Paragraph & Prose Styles

| Context                     | Max Width  | Font              | Size        | Line Height |
|-----------------------------|------------|-------------------|-------------|-------------|
| Article body (annotated)    | 720px      | `--font-sans`     | `--text-base` | 1.75       |
| Reference entry             | 720px      | `--font-mono`     | `--text-sm`   | 1.6        |
| Citation annotation inline  | —          | `--font-mono`     | `--text-sm`   | inherit    |
| AI explanation panel         | 480px      | `--font-sans`     | `--text-sm`   | 1.6        |

---

## 4. Spacing System

### 4.1 Base Unit

All spacing derives from a **4px base unit**. This ensures consistent rhythm across all components.

| Token           | Value  | Pixels | Usage                                        |
|-----------------|--------|--------|----------------------------------------------|
| `--space-0`     | 0      | 0      | Reset                                        |
| `--space-0.5`   | 0.125rem | 2    | Tight inline gaps (icon-to-text micro)        |
| `--space-1`     | 0.25rem  | 4    | Minimum gap, badge padding vertical           |
| `--space-1.5`   | 0.375rem | 6    | Compact button padding vertical               |
| `--space-2`     | 0.5rem   | 8    | Icon gaps, input padding vertical             |
| `--space-3`     | 0.75rem  | 12   | Input padding horizontal, card padding tight  |
| `--space-4`     | 1rem     | 16   | Standard component padding, stack gap         |
| `--space-5`     | 1.25rem  | 20   | Card padding default                          |
| `--space-6`     | 1.5rem   | 24   | Section padding, form group gap               |
| `--space-8`     | 2rem     | 32   | Section margins, panel gutters                |
| `--space-10`    | 2.5rem   | 40   | Large section gaps                            |
| `--space-12`    | 3rem     | 48   | Page section vertical padding                 |
| `--space-16`    | 4rem     | 64   | Hero section padding                          |
| `--space-20`    | 5rem     | 80   | Major section separation                      |
| `--space-24`    | 6rem     | 96   | Landing page section separation               |

### 4.2 Layout Spacing

| Token                     | Value    | Usage                              |
|---------------------------|----------|------------------------------------|
| `--layout-gutter`         | 24px     | Column gutters in grid             |
| `--layout-margin-mobile`  | 16px     | Page margin on mobile              |
| `--layout-margin-tablet`  | 32px     | Page margin on tablet              |
| `--layout-margin-desktop` | 48px     | Page margin on desktop             |
| `--layout-max-width`      | 1280px   | Maximum content width              |
| `--layout-max-width-narrow` | 768px  | Narrow content (auth, settings)    |
| `--layout-max-width-wide` | 1440px   | Wide layouts (results split view)  |
| `--nav-height`            | 64px     | Top navigation bar height          |
| `--sidebar-width`         | 320px    | Results sidebar width              |
| `--sidebar-width-collapsed` | 48px   | Collapsed sidebar (icon only)      |

---

## 5. Elevation & Shadow System

Shadows use a layered approach with two shadow values per level for realism: a tight, dark key shadow and a wider, softer ambient shadow.

| Token                | CSS Value                                                          | Usage                            |
|----------------------|--------------------------------------------------------------------|----------------------------------|
| `--shadow-xs`        | `0 1px 2px 0 rgba(0,0,0,0.05)`                                    | Inputs, toggles                  |
| `--shadow-sm`        | `0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)`   | Cards, badges                    |
| `--shadow-md`        | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)` | Dropdowns, raised cards          |
| `--shadow-lg`        | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)` | Modals, popovers               |
| `--shadow-xl`        | `0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)` | Command palette, overlays     |
| `--shadow-2xl`       | `0 25px 50px -12px rgba(0,0,0,0.25)`                              | Full-screen modals               |
| `--shadow-inner`     | `inset 0 2px 4px 0 rgba(0,0,0,0.06)`                              | Pressed states, sunken inputs    |
| `--shadow-ring`      | `0 0 0 3px rgba(99,102,241,0.4)`                                   | Focus ring (primary)             |
| `--shadow-ring-error`| `0 0 0 3px rgba(239,68,68,0.4)`                                    | Focus ring (error state)         |

### Dark Mode Shadow Adjustments

In dark mode, shadow opacity is increased by 1.5× and the ambient component shifts toward the primary colour for subtle depth cues:

| Token (Dark)         | CSS Value                                                          |
|----------------------|--------------------------------------------------------------------|
| `--shadow-sm`        | `0 1px 3px 0 rgba(0,0,0,0.3), 0 1px 2px -1px rgba(0,0,0,0.2)`   |
| `--shadow-md`        | `0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -2px rgba(0,0,0,0.2)` |
| `--shadow-ring`      | `0 0 0 3px rgba(129,140,248,0.5)`                                  |

---

## 6. Border Radius Scale

| Token                | Value   | Usage                                       |
|----------------------|---------|---------------------------------------------|
| `--radius-none`      | 0       | Sharp edges (dividers, full-bleed images)    |
| `--radius-sm`        | 4px     | Badges, pills, small inline elements         |
| `--radius-md`        | 6px     | Inputs, selects, small buttons               |
| `--radius-lg`        | 8px     | Cards, modals, panels                        |
| `--radius-xl`        | 12px    | Large cards, hero sections                   |
| `--radius-2xl`       | 16px    | Feature cards, pricing cards                 |
| `--radius-full`      | 9999px  | Circular avatars, pill buttons, toggles      |

---

## 7. Component Library Specification

### 7.1 Buttons

All buttons use `--font-sans` at `--font-semibold`. The height is determined by size variant. Border radius is `--radius-md`. Transitions use `--duration-fast` with `--ease-out`.

#### Size Variants

| Size   | Height | Padding (h)  | Font Size    | Icon Size | Min Width |
|--------|--------|---------------|--------------|-----------|-----------|
| `xs`   | 28px   | 8px           | `--text-xs`  | 14px      | 60px      |
| `sm`   | 32px   | 12px          | `--text-sm`  | 16px      | 72px      |
| `md`   | 40px   | 16px          | `--text-sm`  | 18px      | 88px      |
| `lg`   | 48px   | 20px          | `--text-base`| 20px      | 104px     |

#### Style Variants

**Primary Button**
| State    | Background         | Text              | Border             | Shadow           |
|----------|--------------------|--------------------|---------------------|------------------|
| Default  | `--primary-600`    | `#FFFFFF`          | none                | `--shadow-xs`    |
| Hover    | `--primary-700`    | `#FFFFFF`          | none                | `--shadow-sm`    |
| Focus    | `--primary-600`    | `#FFFFFF`          | none                | `--shadow-ring`  |
| Active   | `--primary-800`    | `#FFFFFF`          | none                | `--shadow-inner` |
| Disabled | `--primary-200`    | `--primary-400`    | none                | none             |
| Loading  | `--primary-600`    | `#FFFFFF` (hidden) | none                | `--shadow-xs`    |

Loading state replaces the label with a 16px spinner centred in the button. The button width is locked to prevent layout shift.

**Secondary Button**
| State    | Background         | Text               | Border               |
|----------|--------------------|---------------------|----------------------|
| Default  | `transparent`      | `--primary-600`     | 1px `--primary-200`  |
| Hover    | `--primary-50`     | `--primary-700`     | 1px `--primary-300`  |
| Focus    | `transparent`      | `--primary-600`     | `--shadow-ring`      |
| Active   | `--primary-100`    | `--primary-800`     | 1px `--primary-300`  |
| Disabled | `transparent`      | `--neutral-300`     | 1px `--neutral-200`  |

**Ghost Button**
| State    | Background         | Text               | Border |
|----------|--------------------|---------------------|--------|
| Default  | `transparent`      | `--neutral-600`     | none   |
| Hover    | `--neutral-100`    | `--neutral-800`     | none   |
| Focus    | `transparent`      | `--neutral-600`     | `--shadow-ring` |
| Active   | `--neutral-200`    | `--neutral-900`     | none   |
| Disabled | `transparent`      | `--neutral-300`     | none   |

**Danger Button**
| State    | Background         | Text               | Border |
|----------|--------------------|---------------------|--------|
| Default  | `--error-600`      | `#FFFFFF`           | none   |
| Hover    | `--error-700`      | `#FFFFFF`           | none   |
| Focus    | `--error-600`      | `#FFFFFF`           | `--shadow-ring-error` |
| Active   | `--error-800`      | `#FFFFFF`           | none   |
| Disabled | `--error-200`      | `--error-400`       | none   |

#### Button with Icon

Icons are placed leading (left in LTR) by default, with an `--space-2` gap between icon and label. Icon-only buttons are square (width = height) and require an `aria-label`.

#### Button Group

Adjacent buttons in a group collapse their border radii: first child gets `border-radius: --radius-md 0 0 --radius-md`, middle children get `0`, last child gets `0 --radius-md --radius-md 0`. A 1px divider in `--border-default` separates them.

---

### 7.2 Inputs

**Text Input**

| Property           | Value                                                   |
|--------------------|---------------------------------------------------------|
| Height             | 40px (md), 32px (sm)                                    |
| Background         | `--bg-surface` (light), `--bg-surface-raised` (dark)    |
| Border             | 1px `--border-default`                                  |
| Border Radius      | `--radius-md`                                            |
| Padding            | 12px horizontal, 8px vertical                            |
| Font               | `--font-sans`, `--text-base`, `--font-regular`           |
| Placeholder colour | `--text-disabled`                                        |

| State    | Border              | Shadow              |
|----------|----------------------|----------------------|
| Default  | `--border-default`   | `--shadow-xs`        |
| Hover    | `--border-strong`    | `--shadow-xs`        |
| Focus    | `--primary-500`      | `--shadow-ring`      |
| Error    | `--error-500`        | `--shadow-ring-error`|
| Disabled | `--neutral-100` bg   | none                 |

**Input with Label:** Label is placed above the input with `--space-1.5` gap. Label uses `--text-sm`, `--font-medium`, `--text-primary`. Required fields display a `*` in `--error-500` after the label text.

**Input with Helper Text:** Helper text appears below the input with `--space-1` gap. Uses `--text-xs`, `--text-tertiary`. In error state, helper text changes to `--error-600` and displays the error message.

**Input with Prefix/Suffix:** Icons or text placed inside the input field. Prefix has left padding adjusted to `36px` to accommodate a 16px icon at `12px` from left edge. Suffix mirrors this on the right.

**Textarea:** Same styling as text input. Default height: 120px. Resize handle visible on bottom-right. `resize: vertical` enabled. Character counter below right-aligned in `--text-xs`.

---

### 7.3 Select

Follows input styling. A 16px chevron-down icon in `--text-tertiary` is positioned `12px` from the right edge. `appearance: none` removes native OS chrome. The dropdown menu uses `--shadow-lg`, `--radius-lg`, and appears 4px below the trigger. Each option is `40px` tall with `12px` horizontal padding. Selected option shows a checkmark icon in `--primary-600` and `--primary-50` background. Hover state uses `--neutral-100` background.

---

### 7.4 Checkbox

| Property        | Value                                                        |
|-----------------|--------------------------------------------------------------|
| Size            | 18px × 18px                                                  |
| Border          | 2px `--border-strong`                                        |
| Border Radius   | `--radius-sm`                                                 |
| Background      | `transparent` (unchecked), `--primary-600` (checked)          |
| Check icon      | 12px white SVG checkmark, stroke-width 2.5                    |
| Transition      | `--duration-fast` scale + opacity                              |
| Indeterminate   | 10px × 2px white horizontal bar                               |

Label is placed right of checkbox with `--space-2` gap. Clickable area extends to full label width. Focus ring is `--shadow-ring` on the checkbox square.

---

### 7.5 Toggle Switch

| Property        | Value                                                        |
|-----------------|--------------------------------------------------------------|
| Track size      | 44px × 24px                                                  |
| Thumb size      | 20px × 20px                                                  |
| Track (off)     | `--neutral-200`                                               |
| Track (on)      | `--primary-600`                                               |
| Thumb           | `#FFFFFF` with `--shadow-sm`                                  |
| Thumb position  | `2px` from left (off), `22px` from left (on)                  |
| Transition      | `--duration-normal` with `--ease-out` on `transform`          |
| Focus           | `--shadow-ring` around track                                  |

Role: `role="switch"`, `aria-checked="true|false"`. Keyboard: `Space` toggles, `Enter` toggles.

---

### 7.6 Cards

**Base Card**

| Property        | Value                                               |
|-----------------|-----------------------------------------------------|
| Background      | `--bg-surface`                                       |
| Border          | 1px `--border-default`                               |
| Border Radius   | `--radius-lg`                                        |
| Shadow          | `--shadow-sm`                                        |
| Padding         | `--space-5` (20px)                                   |

**Interactive Card** (hover enabled): Hover adds `--shadow-md` and `translateY(-1px)` with `--duration-normal`. Cursor: `pointer`. Focus-visible adds `--shadow-ring`.

**Citation Result Card:** Left border is 3px wide, colour determined by citation status:
- Matched: `--color-success-500`
- Possible match: `--color-warning-500`
- No match: `--color-error-500`
- Retracted: `--color-retracted`
- Hallucinated: `--color-hallucinated`

Content layout: Status icon (20px) + Citation text (flex-grow) + Expand chevron (20px). Expanded state reveals AI explanation below a 1px `--border-default` separator.

---

### 7.7 Badges / Pills (Citation Status)

The most critical visual component — these communicate citation checking results at a glance.

| Variant        | Background          | Text                | Icon (Leading)    | Border             |
|----------------|---------------------|---------------------|-------------------|---------------------|
| Matched        | `--success-100`     | `--success-700`     | ✓ checkmark       | 1px `--success-200` |
| Possible       | `--warning-100`     | `--warning-700`     | ? question mark   | 1px `--warning-200` |
| No Match       | `--error-100`       | `--error-700`       | ✕ cross           | 1px `--error-200`   |
| Retracted      | `#F3E8FF`           | `--color-retracted` | ⚠ warning         | 1px `#DDD6FE`       |
| Hallucinated   | `#FDF2F8`           | `--color-hallucinated` | 🤖 robot       | 1px `#FBCFE8`       |
| Crossref ✓     | `#ECFEFF`           | `--crossref-verified` | ✓ checkmark    | 1px `#A5F3FC`       |
| Style Issue    | `--info-100`        | `--info-700`        | ℹ info            | 1px `--info-200`    |

| Size   | Height | Padding (h) | Font Size    | Icon Size | Border Radius  |
|--------|--------|-------------|--------------|-----------|----------------|
| `sm`   | 22px   | 6px         | `--text-xs`  | 12px      | `--radius-full`|
| `md`   | 28px   | 10px        | `--text-sm`  | 14px      | `--radius-full`|
| `lg`   | 34px   | 12px        | `--text-sm`  | 16px      | `--radius-full`|

All badges have `font-weight: --font-medium`. Icons use a `--space-1` gap from text.

---

### 7.8 Modals

| Property                 | Value                                              |
|--------------------------|-----------------------------------------------------|
| Overlay                  | `rgba(0,0,0,0.5)` (light), `rgba(0,0,0,0.7)` (dark)|
| Container width (sm)     | 400px                                                |
| Container width (md)     | 560px                                                |
| Container width (lg)     | 720px                                                |
| Container max-height     | `calc(100vh - 128px)`                                |
| Background               | `--bg-surface-overlay`                               |
| Border Radius            | `--radius-xl`                                        |
| Shadow                   | `--shadow-xl`                                        |
| Padding                  | `--space-6` (24px)                                   |
| Header                   | Title (`--text-xl`) + close button (top-right)       |
| Footer                   | Right-aligned action buttons, separated by `--space-3`|
| Entry animation          | Fade in overlay (0→1 opacity), scale up content (0.95→1) |
| Exit animation           | Reverse of entry                                      |

Focus trap: When modal opens, focus moves to the first focusable element. `Tab` and `Shift+Tab` cycle within the modal. `Escape` closes. `aria-modal="true"`, `role="dialog"`, `aria-labelledby` pointing to the title element.

---

### 7.9 Tooltips

| Property        | Value                                               |
|-----------------|-----------------------------------------------------|
| Background      | `--neutral-900` (light), `--neutral-100` (dark)      |
| Text            | `#FFFFFF` (light), `--neutral-900` (dark)             |
| Font            | `--text-xs`, `--font-medium`                          |
| Padding         | 6px 10px                                              |
| Border Radius   | `--radius-sm`                                         |
| Max Width       | 240px                                                 |
| Arrow           | 6px CSS triangle, same background                     |
| Shadow          | `--shadow-md`                                         |
| Delay           | 300ms show delay, 0ms hide delay                      |
| Placement       | Auto (prefers top, flips if insufficient space)       |
| Entry animation | Fade in + 4px translate from placement direction      |

Accessible via `aria-describedby` linking trigger to tooltip. Shown on `:hover` and `:focus-visible`. Dismissed on `Escape`.

---

### 7.10 Toast Notifications

Toasts appear in the top-right corner of the viewport, stacking downward with `--space-3` gap.

| Property        | Value                                               |
|-----------------|-----------------------------------------------------|
| Width           | 400px (desktop), `calc(100vw - 32px)` (mobile)      |
| Min Height      | 56px                                                 |
| Background      | `--bg-surface-overlay`                               |
| Border          | 1px `--border-default`                               |
| Border Radius   | `--radius-lg`                                        |
| Shadow          | `--shadow-lg`                                        |
| Padding         | 12px 16px                                            |
| Entry animation | Slide in from right + fade (300ms)                    |
| Exit animation  | Slide out to right + fade (200ms)                     |
| Auto-dismiss    | 5000ms (info), 8000ms (error), manual dismiss only (action required) |

Layout: `[Status Icon 20px] [--space-3] [Title + Description (flex-grow)] [--space-3] [Close ✕ 16px]`

| Variant | Left accent    | Icon colour       |
|---------|----------------|-------------------|
| Success | 3px `--success-500` | `--success-600` |
| Error   | 3px `--error-500`   | `--error-600`   |
| Warning | 3px `--warning-500` | `--warning-700` |
| Info    | 3px `--info-500`    | `--info-600`    |

Action toasts include a text button (primary style) below the description.

---

### 7.11 Tabs

**Line Tabs (default)**

| Property        | Value                                               |
|-----------------|-----------------------------------------------------|
| Tab height      | 44px                                                 |
| Tab padding     | 0 16px                                               |
| Font            | `--text-sm`, `--font-medium`                          |
| Border bottom   | 2px transparent (inactive), 2px `--primary-600` (active) |
| Text colour     | `--text-secondary` (inactive), `--primary-600` (active) |
| Hover           | `--text-primary`, `--neutral-100` background          |
| Focus           | `--shadow-ring` inset                                  |
| Transition      | `--duration-fast` on border-colour and text colour     |
| Indicator       | Animated underline slides to active tab               |

Tab container has a full-width 1px `--border-default` bottom border. Keyboard: `ArrowLeft`/`ArrowRight` move between tabs, `Home`/`End` go to first/last. `role="tablist"` on container, `role="tab"` on each tab, `role="tabpanel"` on content.

**Pill Tabs (for filter groups)**

Same structure but each tab is a pill with `--radius-full`, `--neutral-100` background (inactive), `--primary-600` background + white text (active). Used for citation status filters on the results page.

---

### 7.12 Accordions

| Property        | Value                                               |
|-----------------|-----------------------------------------------------|
| Trigger height  | 48px minimum                                         |
| Trigger padding | 16px horizontal                                      |
| Background      | `--bg-surface`                                        |
| Border          | 1px `--border-default` bottom                         |
| Chevron         | 16px, right-aligned, rotates 180° when open           |
| Content padding | 16px horizontal, 12px vertical                        |
| Transition      | `--duration-normal` height + opacity                   |
| Font (trigger)  | `--text-sm`, `--font-medium`                           |

`aria-expanded="true|false"` on trigger. Content region has `role="region"` and `aria-labelledby` linking to trigger. Keyboard: `Enter`/`Space` toggle, `ArrowDown`/`ArrowUp` move between accordion items.

---

### 7.13 Progress Indicators

**Linear Progress Bar**
| Property        | Value                                               |
|-----------------|-----------------------------------------------------|
| Track height    | 8px                                                  |
| Track background| `--neutral-200`                                       |
| Fill            | `--primary-600`                                       |
| Border Radius   | `--radius-full`                                       |
| Transition      | `--duration-normal` width                              |
| Indeterminate   | Shimmer animation, 2s loop                             |

Used for document upload progress and AI processing progress. `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`.

**Circular Spinner**
| Size   | Diameter | Stroke Width |
|--------|----------|--------------|
| `sm`   | 16px     | 2px          |
| `md`   | 24px     | 3px          |
| `lg`   | 40px     | 4px          |
| `xl`   | 64px     | 5px          |

Track: `--neutral-200`. Active segment: `--primary-600`. Rotation: continuous 800ms linear.

**Step Indicator**
Used for the upload → processing → results flow. Horizontal stepper with numbered circles (32px diameter) connected by lines. Completed steps show a checkmark in `--primary-600` fill. Current step has `--primary-600` outline with pulsing animation. Future steps use `--neutral-300` outline.

---

### 7.14 File Upload Dropzone

| Property            | Value                                               |
|---------------------|-----------------------------------------------------|
| Min Height          | 200px                                                |
| Background          | `--bg-surface-sunken`                                 |
| Border              | 2px dashed `--border-strong`                          |
| Border Radius       | `--radius-xl`                                         |
| Text                | `--text-secondary`, centred                           |
| Icon                | 48px upload cloud icon in `--neutral-400`             |
| Drag-over state     | Border: 2px dashed `--primary-500`, Background: `--primary-50` |
| Accepted file label | "Drag & drop .docx or .pdf" in `--text-sm`            |
| Browse button       | Secondary button style below the label                 |
| Error state         | Border: 2px dashed `--error-500`, error message below  |

After file selection, the dropzone transforms into a file preview card: `[File icon 32px] [Filename + size] [Progress bar] [✕ Remove]`. Multiple uploads are stacked vertically with `--space-2` gap.

Accessible: `<input type="file">` is visually hidden but keyboard-focusable. The entire dropzone is clickable. `aria-label="Upload document"`.

---

### 7.15 Colour-Coded Annotation Highlights

Used in the annotated article view to highlight citations inline within the document text.

| Status        | Background Colour    | Underline Colour       | Text Colour Shift |
|---------------|----------------------|-------------------------|-------------------|
| Matched       | `--success-50`       | 2px solid `--success-400`| none              |
| Possible      | `--warning-50`       | 2px solid `--warning-400`| none              |
| No Match      | `--error-50`         | 2px solid `--error-400`  | none              |
| Retracted     | `#F3E8FF`            | 2px solid `#A78BFA`      | none              |
| Hallucinated  | `#FDF2F8`            | 2px solid `#F472B6`      | none              |
| Selected      | `--primary-100`      | 2px solid `--primary-500`| none              |
| Ignored       | none                 | 2px dotted `--neutral-300`| `--text-disabled`|

Highlights are implemented as `<mark>` elements with `cursor: pointer`. Clicking a highlight scrolls the citation list panel to the matching entry and vice versa (bidirectional scroll sync). Hovering shows a tooltip with the status badge and short summary.

---

## 8. Dark Mode

### 8.1 Implementation Strategy

Dark mode is implemented via a `data-theme="dark"` attribute on the `<html>` element. CSS custom properties are redefined within `[data-theme="dark"]` scope. The theme preference is determined by this priority order:

1. User's explicit choice (stored in `localStorage` as `citepilot-theme`)
2. System preference via `prefers-color-scheme: dark`
3. Default: `light`

A theme toggle component in the top navigation allows manual switching. The toggle uses the Sun/Moon icon pattern with a cross-fade animation.

### 8.2 Dark Mode Colour Mapping

All surface, text, and border tokens are remapped as specified in Section 2.5. Additional rules:

- Primary colour shifts from 600→400 for interactive elements to maintain visibility on dark surfaces
- Shadows become darker and higher opacity (Section 5)
- Success/Warning/Error badge backgrounds use the `50` shade at 15% opacity (e.g. `rgba(34,197,94,0.15)`) to prevent washed-out pastel appearance on dark surfaces
- Images and illustrations receive no automatic filter; marketing assets provide dark-mode variants
- The annotated article view background shifts to `--bg-surface-raised` to distinguish it from the page background

### 8.3 Dark Mode Component Overrides

| Component       | Light → Dark Change                                          |
|-----------------|--------------------------------------------------------------|
| Cards           | Border becomes `--border-default` (dark), shadow reduced      |
| Inputs          | Background becomes `--bg-surface-raised`                      |
| Tooltips        | Background/text swap (see Section 7.9)                        |
| Dropzone        | Background becomes `--bg-surface-sunken` (dark value)         |
| Annotation highlights | Background opacity reduced to 20%                      |
| Modal overlay   | Opacity increased to 0.7                                      |
| Focus ring      | Uses `--primary-400` at 50% opacity                           |

---

## 9. Motion & Animation Guidelines

### 9.1 Duration Tokens

| Token                | Value   | Usage                                          |
|----------------------|---------|-------------------------------------------------|
| `--duration-instant`  | 0ms     | Immediate state changes (colour only)            |
| `--duration-fast`     | 150ms   | Micro-interactions: hover, focus, toggle          |
| `--duration-normal`   | 250ms   | Panel expand/collapse, tab switch, card hover     |
| `--duration-slow`     | 350ms   | Modal enter, page transitions, slide-in           |
| `--duration-slower`   | 500ms   | Complex orchestrated animations                   |

### 9.2 Easing Curves

| Token              | Value                          | Usage                                     |
|--------------------|--------------------------------|-------------------------------------------|
| `--ease-in`        | `cubic-bezier(0.4, 0, 1, 1)`  | Elements exiting the viewport              |
| `--ease-out`       | `cubic-bezier(0, 0, 0.2, 1)`  | Elements entering the viewport             |
| `--ease-in-out`    | `cubic-bezier(0.4, 0, 0.2, 1)`| Elements moving within the viewport        |
| `--ease-spring`    | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful micro-interactions (toggle thumb) |
| `--ease-linear`    | `linear`                       | Spinners, continuous animations            |

### 9.3 Animation Patterns

**Enter/Exit Pairs**
| Component       | Enter                                   | Exit                                   |
|-----------------|-----------------------------------------|----------------------------------------|
| Modal           | Fade + scale(0.95→1), `--duration-slow` | Fade + scale(1→0.95), `--duration-normal` |
| Dropdown        | Fade + translateY(-4→0), `--duration-normal` | Fade + translateY(0→-4), `--duration-fast` |
| Toast           | translateX(100%→0), `--duration-slow`    | translateX(0→100%), `--duration-normal`  |
| Tooltip         | Fade + translate 4px, `--duration-fast`  | Fade, `--duration-fast`                  |
| Sidebar         | translateX(-100%→0), `--duration-slow`   | translateX(0→-100%), `--duration-normal`  |
| Accordion content | Height 0→auto + fade, `--duration-normal` | Height auto→0 + fade, `--duration-fast` |

**Skeleton Screen Shimmer**
A gradient animation from `--neutral-100` → `--neutral-200` → `--neutral-100` sweeping left to right over 1.5s, looping infinitely. In dark mode: `--bg-surface-raised` → `#2E3348` → `--bg-surface-raised`.

**Progress Indeterminate**
The progress bar fill oscillates width between 30% and 80%, translating from left to right, over 2s with `--ease-in-out`.

### 9.4 Reduced Motion

When `prefers-reduced-motion: reduce` is detected:

- All `transition-duration` values clamp to `--duration-instant` (0ms) or `--duration-fast` (150ms max)
- All `animation` properties are set to `none` except essential progress indicators
- Skeleton shimmer is replaced with a static `--neutral-200` fill with pulsing opacity (0.5→1, 1.5s)
- Modal and dropdown enter/exit use opacity-only transitions (no scale or translate)
- The step indicator pulsing animation is disabled; current step uses a solid ring instead

---

## 10. Accessibility

### 10.1 Standards Compliance

CitePilot targets **WCAG 2.1 Level AA** compliance across all interactive surfaces. Level AAA is targeted for text contrast ratios on core reading surfaces (annotated article view).

### 10.2 Colour Contrast Requirements

| Context                        | Minimum Ratio | Standard |
|--------------------------------|---------------|----------|
| Normal text on backgrounds     | 4.5:1         | AA       |
| Large text (≥18pt or 14pt bold)| 3:1           | AA       |
| UI components and graphics     | 3:1           | AA       |
| Annotated article body text    | 7:1           | AAA      |
| Focus indicators               | 3:1           | AA       |

All colour tokens in Section 2 include measured contrast ratios. Citation status colours always pair with their `700` or `800` shade for text to meet AA requirements. The `500` shades are permitted only for non-text UI elements (icons, borders, progress fills) where 3:1 is sufficient.

### 10.3 Focus Indicators

**Visible focus indicators are applied to every interactive element.** The design uses a dual-ring approach for maximum visibility across backgrounds:

```css
/* Default focus style */
:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
  border-radius: var(--radius-md);
}

/* Dark mode adjustment */
[data-theme="dark"] :focus-visible {
  outline-color: var(--color-primary-400);
}

/* High-contrast override for users who enable it */
@media (forced-colors: active) {
  :focus-visible {
    outline: 3px solid LinkText;
    outline-offset: 2px;
  }
}
```

Focus indicators are never removed or hidden. `:focus` (non-keyboard) uses a subtler ring at reduced opacity (30%) to avoid visual noise for mouse users while maintaining accessibility.

### 10.4 ARIA Patterns by Component

| Component           | ARIA Pattern                                                       |
|---------------------|--------------------------------------------------------------------|
| Top navigation      | `<nav aria-label="Main navigation">`, current page: `aria-current="page"` |
| Sidebar (results)   | `<aside aria-label="Citation results">`, `role="complementary"`    |
| Tab bar             | `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected` |
| Modal               | `role="dialog"`, `aria-modal="true"`, `aria-labelledby`           |
| Toast               | `role="status"`, `aria-live="polite"` (info), `aria-live="assertive"` (error) |
| Tooltip             | `role="tooltip"`, trigger has `aria-describedby`                   |
| Accordion           | `aria-expanded`, trigger has `aria-controls`, panel has `role="region"` |
| Progress bar        | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label` |
| File upload         | `<input type="file">` with `aria-label`, dropzone has `role="button"` |
| Citation badge      | `role="status"`, text content describes status (e.g. "Matched citation") |
| Results table       | `role="table"`, sortable columns: `aria-sort="ascending|descending|none"` |
| Search/filter       | `role="search"`, `aria-label="Filter citations"`                   |
| Toggle switch       | `role="switch"`, `aria-checked="true|false"`, `aria-label`        |
| Annotated highlight | `role="mark"`, `aria-label="Citation: (Author, Year) — Status: Matched"` |

### 10.5 Keyboard Navigation Patterns

| Context              | Keys                                                      |
|----------------------|-----------------------------------------------------------|
| Global               | `Tab`/`Shift+Tab`: move between focusable elements        |
| Modal                | Focus trapped. `Escape`: close. `Tab`: cycle within.      |
| Dropdown             | `Enter`/`Space`: open. `ArrowUp`/`ArrowDown`: navigate options. `Escape`: close. `Enter`: select. |
| Tabs                 | `ArrowLeft`/`ArrowRight`: switch tabs. `Home`/`End`: first/last tab. |
| Results list         | `ArrowUp`/`ArrowDown`: move between citations. `Enter`: expand details. `Escape`: collapse. |
| Annotated article    | `Tab`: move to next highlighted citation. `Enter`: open detail panel. |
| File upload          | `Enter`/`Space`: open file picker. `Delete`: remove selected file. |
| Toggle               | `Space`: toggle. `Enter`: toggle.                          |
| Toast                | Auto-focused when actionable. `Escape`: dismiss.           |

### 10.6 Screen Reader Announcements

| Event                                | Announcement                                                          |
|--------------------------------------|-----------------------------------------------------------------------|
| File upload started                  | "Uploading [filename], [size]"                                         |
| Upload progress update               | "[percentage]% uploaded" (announced at 25%, 50%, 75%, 100%)            |
| Upload complete                      | "Upload complete. Processing document."                                |
| AI processing started                | "Analyzing citations. This may take up to 30 seconds."                 |
| AI processing complete               | "Analysis complete. [N] citations found. [M] issues detected."         |
| Citation expanded                    | "Citation details: [Author, Year]. Status: [status]. [AI explanation]" |
| Filter applied                       | "Filter applied. Showing [N] of [Total] citations."                    |
| Error toast                          | Full error message via `aria-live="assertive"`                         |
| Theme switched                       | "Switched to [light/dark] mode."                                       |

### 10.7 Content Accessibility

- All images include descriptive `alt` text
- Decorative images use `alt=""` and `aria-hidden="true"`
- All form fields have associated `<label>` elements (not just placeholder text)
- Error messages are linked to inputs via `aria-describedby`
- Page titles update dynamically via `<title>` to reflect the current view
- Language attribute `lang="en"` is set on `<html>`
- Heading hierarchy is strictly sequential (`h1` → `h2` → `h3`, no skipping)
- Skip-to-content link is the first focusable element on every page

---

## 11. Responsive Breakpoints

| Token                | Width   | Columns | Gutter | Margin |
|----------------------|---------|---------|--------|--------|
| `--breakpoint-sm`    | 640px   | 4       | 16px   | 16px   |
| `--breakpoint-md`    | 768px   | 8       | 20px   | 32px   |
| `--breakpoint-lg`    | 1024px  | 12      | 24px   | 40px   |
| `--breakpoint-xl`    | 1280px  | 12      | 24px   | 48px   |
| `--breakpoint-2xl`   | 1440px  | 12      | 24px   | 64px   |

Mobile-first approach: base styles target `< 640px`, then scale up. The results page switches from stacked panels (mobile) to split view (≥1024px) to tri-panel (≥1280px).

---

## 12. Iconography

Icons use the **Lucide** icon set (MIT licensed, tree-shakeable, consistent 24px grid). Stroke width: 1.5px at 24px size, scaling proportionally.

| Context              | Size  | Stroke |
|----------------------|-------|--------|
| Inline text          | 16px  | 1.5px  |
| Button icon          | 18px  | 1.5px  |
| Navigation           | 20px  | 1.5px  |
| Feature card         | 24px  | 1.5px  |
| Empty state hero     | 48px  | 1.25px |
| Landing page feature | 32px  | 1.5px  |

Custom icons (logo, citation-specific glyphs) follow the same 24px grid with 2px padding and 1.5px stroke weight.

---

## 13. Design Token Export Format

Tokens are maintained in a single `tokens.json` file following the W3C Design Token Community Group specification. They are compiled via Style Dictionary into:

- CSS custom properties (`tokens.css`) for the Next.js frontend
- Tailwind CSS theme extension (`tailwind.tokens.js`)
- TypeScript constants (`tokens.ts`) for runtime access in components

```
tokens/
├── tokens.json           # Source of truth (W3C DTCG format)
├── build/
│   ├── css/
│   │   ├── tokens.css    # CSS custom properties
│   │   └── tokens.dark.css
│   ├── tailwind/
│   │   └── tailwind.tokens.js
│   └── ts/
│       └── tokens.ts
└── style-dictionary.config.js
```
