# Wireframes & Page Mockups Specification

This document details the layout, interface zones, grid systems, and structural organization of CitePilot's core web application screens.

---

## 1. Grid and Layout System

CitePilot utilizes a responsive flex/grid system based on Tailwind-equivalent layouts:
- **Desktop Breakpoint**: 1200px+ (12-column grid, max-width: 1440px)
- **Tablet Breakpoint**: 768px - 1199px (8-column grid)
- **Mobile Breakpoint**: Under 768px (4-column grid, single-column stack)
- **Base Spacing Scale**: 4px base (e.g., 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px)

---

## 2. Page Wireframe Specifications

### 2.1 Landing Page Layout

```
+-----------------------------------------------------------------------+
|  CitePilot [Logo]      Product Tour    Pricing    Help    [Login Btn] |
+-----------------------------------------------------------------------+
|                                                                       |
|               Verify Your Academic Citations in Seconds               |
|            Stop referencing errors. Powered by AI and Crossref.       |
|                                                                       |
|                     [ Drop your document here (.docx) ]               |
|                                     or                                |
|                        [ Paste your manuscript text ]                 |
|                                                                       |
|                     (checked over 500 million citations)              |
|                                                                       |
+-----------------------------------------------------------------------+
|  [ Features Panel ]       [ How It Works ]       [ Retraction Alert ] |
+-----------------------------------------------------------------------+
```

---

### 2.2 Results Page Layout (Desktop Split View)

This is the primary user interface workspace. It is structured into three main zones:
- **Left Column**: In-Text Citations list with status colors and filter actions.
- **Center Column**: Fully annotated document view highlighting matched, partial, or missing citations.
- **Right Column**: Interactive Reference List check pane showing occurrences, external validations, and alphabetical checks.

```
+-----------------------------------------------------------------------+
|  Results | [Single View] [Split View]  |  [Download PDF] [Start Again]  |
+------------------------------------+----------------------------------+
| IN-TEXT CITATIONS                  | ANNOTATED DOCUMENT               |
| Filter: [ ] Issues Only [x] Styles |                                  |
|                                    | The findings (Smith, 2020[Green])|
| 1. Smith (2020)              [OK]  | were disputed by Doe (2021[Red]).|
|    - Matched to ref entry #12      | The paper on COVID-19 in         |
|                                    | 2020[Gray] was published...      |
| 2. Doe (2021)             [Error]  |                                  |
|    - No references match year      |                                  |
+------------------------------------+----------------------------------+
| REFERENCE LIST CHECK               | AI EXPLANATION DETAIL            |
| Filter: [x] Issues [ ] All         |                                  |
|                                    | [x] Citation #2: Doe (2021)      |
| #1. Smith, J. (2020). Title... [1] | The reference entry was found as |
| #2. Doe, A. (2019). Title...   [0] | "Doe, A. (2019)" indicating a    |
|     - Mismatch: Cited 2021 in-text | year discrepancy.                |
|     - Flag: [Not Found in Doc]     | [ Suggestion: Change to 2019 ]   |
+------------------------------------+----------------------------------+
```

---

### 2.3 Upload and Input Workspace

- **Dropzone**: Dotted-border container with file type icons (`.docx`, `.txt`, `.pdf`).
- **Progress State**: Linear progress bar with percentage, current processing stage indicator (e.g. "Segmenting Document", "Extracting Citations", "Querying Crossref").
- **Pastebox**: Textarea container supporting rich copy-paste with baseline styling preserved.

---

### 2.4 Account & Billing Settings

- **Dashboard List**: Cards for previous uploads containing:
  - Document Title
  - Date Checked
  - Style Used (e.g. APA 7th)
  - Number of citations and identified errors
- **Subscription Management**: Card component detailing current tier (Student / Pro / Enterprise), next renewal date, invoice download links, and payment method options (Credit Card, PayPal).

---

### 2.5 Institutional Administration Dashboard

- **Organization Summary**: Total users, active licenses, document quota remaining.
- **Member Management Table**:
  - Name, Email, Active Status, Last Login, Role selector dropdown.
  - Quick action to "Revoke Seat" or "Invite New Member".
- **Usage Reports**: Weekly charts showing processed uploads and top citation style distributions.
