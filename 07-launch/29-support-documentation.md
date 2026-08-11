# 29 — Support Documentation & Help Centre

> **Document ID**: CP-LAUNCH-029
> **Version**: 1.1
> **Last Updated**: 2026-08-11
> **Owner**: Product & Content
> **Location**: Draft for future `https://citepilot.com/help`. **Note:** the help centre is not yet built — support currently runs via email (see Contact Us).

---

## Content Structure

This document contains the complete user-facing help centre content for CitePilot. Each section maps to a help centre category page. Content is written in a friendly, professional tone suitable for students and academics.

**URL Structure**: `citepilot.com/help/{category}/{article-slug}`

---

# 📚 Getting Started

## What is CitePilot?

CitePilot is an AI-powered citation consistency checker that helps you ensure every in-text citation in your academic document matches an entry in your reference list — and vice versa. Unlike traditional rule-based tools, CitePilot uses artificial intelligence to understand context, reduce false positives, and provide intelligent suggestions for fixing issues.

CitePilot supports nine citation styles: APA 7th Edition, APA 6th Edition, Harvard, Vancouver, Chicago, MLA, IEEE, OSCOLA, and Turabian. Whether you're writing a 2,000-word essay or a 100,000-word thesis, CitePilot helps you catch citation errors before your marker or reviewer does.

### What CitePilot checks

- **Citation–reference matching**: Every in-text citation is cross-referenced against your reference list to ensure the author names, year (or number), and formatting are consistent
- **Missing references**: Citations in your text that don't have a matching reference list entry
- **Orphan references**: References in your list that are never cited in the body of your text
- **Author name mismatches**: When "Smith (2023)" in your text corresponds to "Smyth, J. (2023)" in your references
- **Year/date mismatches**: When the year in your citation doesn't match the year in the reference
- **Style formatting issues**: Incorrect use of "et al.", ampersand (&) vs "and", missing commas, incorrect punctuation
- **Alphabetical order**: Whether your reference list is sorted correctly per your citation style's rules
- **Reference validation**: Whether the papers, books, and sources you cite actually exist (paid plans)
- **Retracted sources**: Whether any of your cited sources have been retracted (paid plans)
- **Hallucinated citations**: Whether an AI tool may have fabricated a citation that doesn't correspond to a real publication (paid plans)

---

## How to check your document

### Option 1: Upload a file

1. Go to [citepilot.com](https://citepilot.com) — no account or sign-in is required
2. Click **Upload Document** or drag and drop your file into the upload area
3. Supported formats: `.docx` (Microsoft Word), `.pdf`, `.txt`, `.rtf`, and `.bib`, up to 50 MB
4. Select your **citation style** from the dropdown (e.g., APA 7th Edition)
5. Click **Check Citations**
6. Your results will appear within seconds for short documents, or up to 3 minutes for thesis-length documents

### Option 2: Paste text

1. Click the **Paste Text** tab on the upload page
2. Paste your document text into the text area, including your reference list
3. Select your citation style
4. Click **Check Citations**

### Tips for best results

- **Include your full reference list** — CitePilot needs both your body text and references to perform matching
- **Keep your original formatting** — uploading a `.docx` file preserves structure better than pasting plain text
- **Choose the correct citation style** — an APA document checked against Harvard rules will produce inaccurate results
- **For multi-chapter documents** (e.g., theses), CitePilot automatically detects multiple reference lists — no special formatting required

---

## Supported file formats

| Format | Support Level | Notes |
|---|---|---|
| `.docx` (Word) | ✅ Full support | Best results — preserves document structure, headings, and formatting |
| `.pdf` | ✅ Full support | Works well for most PDFs; scanned/image-based PDFs may have reduced accuracy |
| Plain text (pasted) | ✅ Full support | Paste directly into the text box; ensure reference list is included |
| `.txt` / `.rtf` / `.bib` | ✅ Supported | Upload directly; BibTeX entries are parsed from `.bib` files |
| `.doc` (Legacy Word) | ❌ Not supported | Save as `.docx` in Microsoft Word first |
| `.odt` (LibreOffice) | ❌ Not supported | Export as `.docx` from LibreOffice first |
| `.tex` (LaTeX) | ❌ Not yet supported | Compile to PDF first; native LaTeX/BibTeX support is on our roadmap |
| Google Docs | ❌ Not directly supported | Download as `.docx` from Google Docs (File → Download → Microsoft Word) |

---

## Free vs paid plans

| Feature | Free | Student ($4.99/mo) | Professional ($12.99/mo) | Institutional |
|---|---|---|---|---|
| Uploads per day | 3 | Unlimited | Unlimited | Unlimited |
| Word limit | 5,000 | Unlimited | Unlimited | Unlimited |
| Reference limit | 100 | Unlimited | Unlimited | Unlimited |
| Citation styles | All 9 styles | All 9 styles | All 9 styles | All 9 styles |
| AI explanations | Basic | ✅ Detailed | ✅ Detailed | ✅ Detailed |
| Crossref reference validation | ❌ | ❌ | ✅ | ✅ |
| Retraction checking | ❌ | ❌ | ✅ | ✅ |
| Hallucinated citation detection | ❌ | Basic | ✅ Advanced | ✅ Advanced |
| PDF export | ❌ | ✅ | ✅ | ✅ |
| API access | ❌ | ❌ | ✅ | ✅ |
| Admin dashboard | ❌ | ❌ | ❌ | ✅ |
| SSO integration | ❌ | ❌ | ❌ | ✅ |

---

# 🔍 Understanding Your Results

## Results overview

After CitePilot analyses your document, you'll see a results dashboard with several key areas:

### Summary bar

At the top of your results, you'll see a summary showing:
- **Total citations found** in your document
- **Total references** in your reference list
- **Matched** (green) — citations that correctly match a reference
- **Possible matches** (orange) — citations with a likely but imperfect match
- **No match** (red) — citations with no corresponding reference, or references never cited

### Annotated document view

Your document is displayed with colour-coded highlighting:

- 🟢 **Green highlight**: This citation perfectly matches a reference list entry. No action needed.
- 🟠 **Orange highlight**: This citation partially matches a reference. There may be a minor discrepancy (e.g., a spelling variation in an author's name, or a year off by one). Review the AI's suggestion.
- 🔴 **Red highlight**: No matching reference was found. This is either a missing reference, a significant mismatch, or a potential error.
- 🔵 **Blue highlight**: Style formatting issue (e.g., incorrect "et al." usage, wrong punctuation). The citation matches a reference but doesn't follow your chosen style's formatting rules.

### Click any highlighted citation to see:
- The specific issue identified
- The corresponding reference list entry (if a partial match was found)
- An AI-generated explanation of what's wrong
- A suggested correction (where applicable)

---

## Issue types explained

### Missing reference

**What it means**: A citation in your text (e.g., "Smith, 2023") has no corresponding entry in your reference list.

**Common causes**:
- You forgot to add the reference
- The author's name is spelled differently in the citation vs reference
- The year is different in the citation vs reference
- The reference was accidentally deleted during editing

**How to fix**: Add the full reference to your reference list, or correct the citation to match an existing reference.

### Orphan reference

**What it means**: A reference in your list is never cited anywhere in the body of your text.

**Common causes**:
- You removed a citation during editing but forgot to remove the reference
- You added the reference intending to cite it but haven't yet
- The citation exists but with a different author name or year

**How to fix**: Either add an in-text citation for this reference, or remove it from your reference list.

### Author name mismatch

**What it means**: The author name in your citation doesn't exactly match the name in your reference list entry.

**Examples**:
- Citation says "MacDonald (2021)" but reference says "Macdonald, K. (2021)"
- Citation says "Smith & Jones (2020)" but reference says "Smith, A., & Jonas, B. (2020)"

**How to fix**: Ensure the surname(s) in your in-text citation exactly match the surname(s) in your reference. CitePilot will show you both versions so you can determine the correct spelling.

### Year mismatch

**What it means**: The year in your citation doesn't match the year in the corresponding reference.

**Examples**:
- Citation says "(Brown, 2022)" but reference says "Brown, T. (2023)"
- Often happens with papers that were published online in one year and in print the following year

**How to fix**: Check the publication date of the source and use the correct year in both your citation and reference. For works published online first, most styles use the online publication date.

### Multiple matches

**What it means**: A single citation could match more than one reference in your list. This happens when you cite multiple works by the same author(s) from the same year.

**Example**: You have two papers by Smith published in 2023. In APA style, these should be distinguished as "Smith (2023a)" and "Smith (2023b)".

**How to fix**: Add letter suffixes (a, b, c) to distinguish works by the same author from the same year, in both citations and references.

### Style formatting issue

**What it means**: Your citation matches a reference but doesn't follow the formatting rules of your chosen citation style.

**Common issues**:
- Using "&" instead of "and" (or vice versa) between author names
- Incorrect use of "et al." — e.g., using it on first citation when the style requires listing all authors on first mention
- Missing comma before the year
- Incorrect capitalisation
- Wrong parenthesis style

---

## Filtering and navigating results

### Filters available

- **Show issues only**: Hide all green (matched) citations and show only items needing attention
- **Show style warnings**: Toggle visibility of formatting-only issues (blue highlights)
- **Filter by author**: Show only citations by a specific author
- **Filter by year**: Show only citations from a specific year
- **Filter by issue type**: Show only a specific issue type (missing reference, mismatch, etc.)

### Split view

Click the **Split View** button to see your document on the left and the reference list on the right. Clicking a citation in the document highlights the corresponding reference (if found), and vice versa.

### Ignore button

If CitePilot flags something that you've intentionally done (e.g., citing a personal communication that doesn't appear in references), click the **Ignore** button next to that flag. It will be removed from your issue count and greyed out.

---

# 📝 Citation Styles

## Supported styles

CitePilot currently supports the following citation styles:

### Author-Date Systems

| Style | Use Case | Key Features |
|---|---|---|
| **APA 7th Edition** | Psychology, education, social sciences | (Author, Year), ampersand in parenthetical citations, "et al." from 3+ authors |
| **APA 6th Edition** | Legacy documents using the previous APA edition | (Author, Year), "et al." from 6+ authors on first cite, 3+ on subsequent |
| **Harvard** | Business, humanities (UK/Australia) | (Author Year), no comma between author and year, varies by institution |
| **Chicago Author-Date (17th Ed.)** | History, humanities, sciences | (Author Year), similar to Harvard but with specific punctuation rules |

### Numeric Systems

| Style | Use Case | Key Features |
|---|---|---|
| **Vancouver** | Medicine, biomedical sciences | Superscript or bracketed numbers [1], numbered in order of appearance |
| **IEEE** | Engineering, computer science, IT | Bracketed numbers [1], numbered in order of appearance |

### Note-Based Systems

| Style | Use Case | Key Features |
|---|---|---|
| **Chicago Notes-Bibliography (17th Ed.)** | History, arts, humanities | Footnotes/endnotes with full bibliographic details on first citation, shortened after |
| **OSCOLA** | Law (UK) | Footnotes, no bibliography required (though often included), specific case citation rules |
| **Turabian** | Student papers across disciplines | Adapted from Chicago for student use, available in notes-bibliography and author-date variants |

### Other Systems

| Style | Use Case | Key Features |
|---|---|---|
| **MLA (9th Edition)** | Literature, languages, cultural studies | (Author Page), Works Cited list, no year in in-text citation (year in Works Cited only) |

## How to choose the right style

If you're unsure which style to use:

1. **Check your assignment brief or journal submission guidelines** — they almost always specify the required style
2. **Ask your supervisor or lecturer** — departments often have a preferred style
3. **Common defaults by discipline**:
   - Psychology / Education → APA 7
   - Medicine / Nursing → Vancouver
   - Engineering / Computer Science → IEEE
   - Law (UK) → OSCOLA
   - Humanities / History → Chicago
   - Literature / Languages → MLA
   - Business (UK/AU) → Harvard

## Style-specific notes

### APA 7 vs APA 6

The most significant change between APA 6 and APA 7 for in-text citations is the "et al." rule:
- **APA 6**: List all authors (up to 5) on first citation, then use "et al." for 3+ authors
- **APA 7**: Use "et al." from the first citation for works with 3+ authors

If your university or journal has recently transitioned to APA 7, make sure to select the correct version in CitePilot. Using APA 6 rules on an APA 7 document (or vice versa) will produce false positives.

### Harvard variations

Harvard style is not governed by a single official manual — different universities publish their own Harvard guides. CitePilot follows the most common conventions:
- No comma between author and year: (Smith 2023)
- Ampersand (&) between two authors: (Smith & Jones 2023)
- "et al." for 3+ authors from first citation

If your institution's Harvard guide differs on specific formatting points, you may see some style warnings that are correct for the general convention but not for your specific variant. Use the **Ignore** button for these.

### Numeric styles (Vancouver, IEEE)

For numeric citation styles, CitePilot checks that:
- Each number in the text corresponds to a numbered reference
- Numbers are used in the correct sequence (first citation = [1], second = [2], etc.)
- No gaps or duplicates in numbering
- Each reference in the list is actually cited in the text

---

# 🤖 AI Features

## How CitePilot's AI works

CitePilot uses large language models (LLMs) to analyse your document — the same type of AI behind tools like ChatGPT, but fine-tuned specifically for academic citation analysis. Here's what that means for you:

### Intelligent citation extraction

Traditional citation checkers use pattern matching: they look for anything that resembles "(Author, Year)" and flag it as a citation. This approach produces false positives — for example, flagging "the WHO (2020) guidelines" or "the year 2019 saw significant changes" as citations.

CitePilot's AI understands context. It can distinguish between:
- A genuine citation: "Smith (2023) found that..."
- A parenthetical year that isn't a citation: "Since the pandemic began (2020)..."
- An organisation name with a year: "According to the WHO, as of 2023..."

### Smart reference list detection

You don't need a heading that says exactly "References" on its own line. CitePilot's AI can identify your reference list even if it's titled "Bibliography", "Works Cited", "Reference List", "Sources", or has no heading at all — it recognises the structural pattern of formatted references.

For multi-chapter documents (e.g., a thesis with a reference list at the end of each chapter), CitePilot automatically detects and handles each reference list separately.

### AI-generated explanations

When CitePilot flags an issue, it doesn't just tell you something is wrong — it explains what's wrong and why. For example:

> **Issue**: Author name mismatch
>
> **Explanation**: Your in-text citation refers to "MacDonald (2021)" but the closest matching reference in your list is "Macdonald, K. (2021). The role of cognitive load in educational technology. Journal of Educational Psychology, 45(3), 289–301." The capitalisation of "MacDonald" vs "Macdonald" differs. In APA 7th Edition, the in-text citation should exactly match the surname as it appears in the reference list.
>
> **Suggestion**: Change your in-text citation to "Macdonald (2021)" to match the reference list, or verify the author's preferred spelling and update both the citation and reference consistently.

### Suggested corrections

For many issues, CitePilot provides a specific suggested correction that you can review. These suggestions are generated by AI and should be treated as recommendations — always verify the suggestion against the original source before accepting it.

---

## Hallucinated citation detection

### What are hallucinated citations?

If you've used AI tools (such as ChatGPT, Claude, or Gemini) to help draft your academic work, there's a risk that the AI invented citations that look real but don't correspond to any actual publication. These are called "hallucinated" citations.

A hallucinated citation typically has:
- A plausible-sounding author name
- A realistic journal title
- A believable year
- A convincing article title

But the paper simply doesn't exist.

### How CitePilot detects them

CitePilot cross-references your citations against scholarly metadata registries:
- **Crossref** — the world's largest registry of scholarly metadata (140+ million records)
- **DOI.org** — Digital Object Identifier resolution

Additional verification sources (OpenAlex, PubMed) are on our roadmap.

If a reference cannot be verified against Crossref / DOI resolution and exhibits characteristics of AI-generated text, CitePilot will flag it as potentially hallucinated.

> **Important**: Not finding a reference in these registries doesn't automatically mean it's fake. Some legitimate sources (e.g., very recent publications, non-English works, government reports, unpublished theses) may not be indexed. CitePilot's AI considers these factors and avoids flagging such references as hallucinated when the reference type is unlikely to be indexed.

### This feature is available on:
- **Student plan**: Basic hallucination detection (checks DOI resolution only)
- **Professional plan**: Advanced detection (full Crossref verification with AI confidence scoring)
- **Institutional plan**: Advanced detection with batch processing

---

## Reference validation

### What is reference validation?

Reference validation goes beyond checking whether your citations match your reference list — it checks whether the sources you've cited actually exist in the real world and whether the bibliographic details (author names, title, journal, year, volume, pages) are correct.

### What gets validated

| Detail | Checked Against | Example Issue |
|---|---|---|
| DOI resolution | DOI.org | DOI in reference doesn't resolve to any resource |
| Author names | Crossref | Reference says "Smith, J." but the actual paper is by "Smith, K." |
| Publication year | Crossref | Reference says 2022 but the paper was published in 2023 |
| Journal title | Crossref | Reference says "Journal of Psychology" but the actual journal is "British Journal of Psychology" |
| Volume / issue / pages | Crossref | Page numbers don't match the actual publication |
| Article title | Crossref | Title has significant differences from the real publication |

### Retraction checking

CitePilot checks your references against Crossref's retraction metadata (`is-retracted-by`). If any of your cited sources have been retracted, CitePilot will alert you with:
- The retraction notice
- The reason for retraction (if available)
- A link to the retraction notice

Citing retracted papers in academic work is a serious issue. Retraction checking is available on Professional and Institutional plans.

---

# 👤 Accounts & Subscriptions

## Using CitePilot without an account

CitePilot is currently a **sessionless** tool — you do not need an account or sign-in to use it. Open the workspace, upload or paste your document, and run an audit. Usage is limited to the free tier's daily caps (3 uploads per day, 5,000 words, 100 references). Account creation, analysis history, and saved results are on the roadmap.

## Managing your subscription

### Upgrading your plan

1. Open the **Upgrade** dialog from the dashboard workspace (pricing section or sidebar)
2. Select the plan you'd like to subscribe to
3. Complete the payment process via PayPal (our secure payment processor)
4. Your new plan features are available immediately

### Cancelling your subscription

1. Log in to your **PayPal account** and open your active subscriptions
2. Click **Cancel** on your CitePilot subscription
3. Your plan remains active until the end of your current billing period
4. After cancellation, your usage reverts to the free tier

### Billing and invoices

All billing is handled securely by PayPal. You can:
- View your billing history and invoices in your **PayPal account**
- Download invoices as PDF for expense reimbursement
- Update your payment method at any time from PayPal
- All prices are in USD and include applicable taxes

## Data deletion

CitePilot retains no user accounts and no persistent document data. Uploaded content is processed in memory and discarded after the audit completes — nothing to delete, and nothing kept.

---

## Data privacy

### Document handling

- Your uploaded documents are encrypted in transit (TLS 1.2+)
- Documents are processed in secure, isolated environments
- **All uploaded documents are discarded automatically once the audit completes** (36 hours at most)
- We do not read, share, or use your document content for any purpose other than providing you with citation checking results
- CitePilot keeps no accounts and no analysis history — results live in your browser session only

### What we send to AI providers

To analyse your citations, portions of your document text are sent to Google's Gemini API (our AI provider). This is necessary for AI-powered analysis. We:
- Send only the minimum text necessary for citation analysis (not your entire document)
- Do not allow AI providers to use your data for training their models (we use Google's API with data usage controls enabled)
- Do not store AI analysis inputs or outputs beyond the processing session

### Your rights (GDPR)

You have the right to:
- **Access** your data — request a copy of any data we hold about you
- **Erase** your data — request deletion of any data we hold
- **Object** to processing — contact us to discuss any concerns
- **Withdraw consent** — contact us for cookie-related requests

To exercise any of these rights, email `privacy@citepilot.com`.

---

# 🏛️ For Institutions

## Institutional plans

CitePilot offers custom institutional plans for universities, colleges, and research organisations. Institutional plans provide:

### Access management
- **Centralised admin dashboard** for managing user access
- **SSO integration** (SAML 2.0 / OpenID Connect) with your institution's identity provider
- Automatic provisioning and de-provisioning of user accounts
- Access via institutional email domain (e.g., all `@university.ac.uk` addresses)

### Features included
- All Professional plan features for every user
- Unlimited uploads and word counts
- All 9 citation styles
- Crossref reference validation
- Retraction Watch checking
- Advanced hallucinated citation detection
- PDF export
- API access for integration with your LMS or submission systems

### Usage analytics
- See how many students and staff are using CitePilot
- Track usage by department or faculty
- View most common citation issues across your institution
- Identify trends in citation quality over time
- Export usage reports for internal reporting

### Pricing
Institutional pricing is based on the number of seats (active users) and is negotiated on a per-institution basis. Contact `institutions@citepilot.com` for a custom quote.

## Integration with university systems

CitePilot's API can integrate with:
- **Learning Management Systems (LMS)**: Moodle, Canvas, Blackboard — students can check citations directly from their LMS
- **Submission systems**: Turnitin, Gradescope — add citation checking alongside plagiarism detection
- **Library systems**: Link citation checking to your library's resource discovery tools

## How to get started

1. Email `institutions@citepilot.com` with:
   - Your institution name
   - Estimated number of users (students + staff)
   - Your identity provider (e.g., Microsoft Entra ID, Shibboleth, Okta)
   - Any specific integration requirements
2. We'll schedule a demo and provide a custom quote
3. A pilot programme (typically 3 months) can be arranged for a single department before full rollout

---

# 🔧 Troubleshooting

## My document won't upload

**Check the following**:
- **File format**: Only `.docx`, `.pdf`, `.txt`, `.rtf`, and `.bib` files are supported. If your file is `.doc` or `.odt`, convert it to `.docx` first
- **File size**: Maximum file size is 50 MB. If your file is larger, try removing embedded images before uploading (CitePilot only analyses text, not images)
- **File corruption**: Try opening the file on your computer to verify it's not corrupted. If Word or your PDF reader can't open it, CitePilot won't be able to either
- **Browser issues**: Try clearing your browser cache, disabling extensions, or using a different browser (Chrome, Firefox, Edge, and Safari are all supported)

## CitePilot isn't finding my reference list

CitePilot uses AI to automatically detect your reference list. If it's not being detected:

- **Ensure your references are in the document**: If you upload only the body text without the reference list, CitePilot cannot perform matching
- **Check that references are formatted as a list**: Each reference should be on its own line or paragraph. A block of text with references embedded in sentences may not be detected
- **Try the "Adjust" feature**: If CitePilot identifies the wrong section as your reference list, use the Adjust feature to manually indicate where your reference list begins
- **For pasted text**: Make sure you pasted both your body text and your full reference list

## I'm seeing too many false positives

If CitePilot is flagging things that aren't actually citations:

- **Verify you selected the correct citation style** — APA and Harvard have different rules; selecting the wrong style will produce incorrect results
- **For numeric styles** (Vancouver, IEEE): numbers in your text that aren't citations (e.g., statistical values, page numbers) are typically filtered out by the AI, but some may still be flagged. Use the **Ignore** button for these
- **Report persistent false positives**: Click the 👎 button next to any incorrect flag to report it. This helps us improve CitePilot's accuracy

## My results are taking too long

Expected processing times:
- **Short documents (< 5,000 words)**: 5–15 seconds
- **Medium documents (5,000–20,000 words)**: 15–45 seconds
- **Long documents (20,000–50,000 words)**: 45 seconds – 2 minutes
- **Thesis-length (50,000+ words)**: 2–3 minutes

If your document is taking significantly longer:
- Our servers may be experiencing high load — try again in a few minutes
- For very large documents, consider checking individual chapters separately

## I hit the free-tier limits

The free tier allows **3 uploads per day**, documents up to **5,000 words**, and up to **100 references**. The counter is stored in your browser and resets daily when you clear your site data. If you need more, the Professional plan removes all limits.

## My PDF export looks wrong

- **Ensure your browser is up to date** — PDF generation uses modern browser features
- **Try a different browser** — if PDF export fails in Safari, try Chrome or Firefox
- **For very large documents**: PDF export for documents over 50,000 words may take up to 30 seconds to generate
- **If colour coding is missing**: Check that your PDF viewer supports colour (printing in grayscale will lose the colour coding)

## I was charged but don't have access to paid features

- Subscription activation typically takes less than 30 seconds after payment
- **Refresh the workspace page** to re-check your session
- Check your email for a payment confirmation from PayPal
- If the issue persists, contact `support@citepilot.com` with your payment confirmation and we'll resolve it within 24 hours

---

# ❓ Frequently Asked Questions

### 1. Is CitePilot free?

Yes, CitePilot has a free tier that allows 3 uploads per day, up to 5,000 words per document, and up to 100 references. The free tier includes citation matching for APA 7, Harvard, and MLA styles with basic AI explanations. For unlimited uploads, all citation styles, and advanced features, see our paid plans.

### 2. Is my document stored after checking?

No. CitePilot keeps no accounts and stores nothing persistent — uploaded documents are processed in memory and discarded once the audit completes (36 hours at most). Results exist only in your browser session.

### 3. Can I use CitePilot for my thesis or dissertation?

Absolutely. CitePilot supports documents of any length, including multi-chapter theses with separate reference lists per chapter. For thesis-length documents, the **Professional plan** ($12.99/month) removes all word, reference, and upload limits, and the **Student plan** ($4.99/month, coming soon) offers unlimited word counts and all citation styles at a reduced price.

### 4. Does CitePilot work with LaTeX / BibTeX?

Not directly. CitePilot currently supports `.docx`, `.pdf`, `.txt`, `.rtf`, and `.bib` files, and pasted plain text. If you use LaTeX, compile your document to PDF and upload the PDF. Native LaTeX/BibTeX support is on our roadmap.

### 5. How accurate is CitePilot?

CitePilot's AI-powered analysis achieves over 95% precision and over 90% recall on our benchmark test corpus across all supported citation styles. This is significantly more accurate than rule-based pattern matching tools, which typically produce many false positives (e.g., flagging years in sentences as citations). However, no automated tool is 100% accurate — always review the results and use your academic judgement.

### 6. Can CitePilot fix my citations automatically?

CitePilot provides suggested corrections for many issues, but it does not edit your document directly. You review the suggestions and make changes in your own document. This is intentional — automated editing of academic documents carries too high a risk of introducing errors. CitePilot is a checking and advisory tool.

### 7. What's the difference between CitePilot and Reciteworks?

CitePilot offers several advantages over Reciteworks:
- **AI-powered** vs rule-based analysis (fewer false positives)
- **9 citation styles** vs 3 (Reciteworks only supports APA 6, APA 7, and Harvard)
- **Reference validation** against the Crossref scholarly metadata registry
- **Hallucinated citation detection** (does the cited paper actually exist?)
- **Retraction checking** via Crossref retraction metadata
- **AI-generated explanations and suggestions**, not just error flags
- **Multi-reference-list support** for theses and dissertations
- **Smart reference section detection** — no need for an exact "References" heading

### 8. Can CitePilot check if my quotes are accurate?

Not currently. CitePilot verifies that your in-text citations match your reference list entries and that the cited sources exist. It does not check whether quoted text actually appears in the cited document. This feature may be added in a future release.

### 9. Does CitePilot support non-English languages?

CitePilot can process documents written in English. Support for additional languages (including documents with mixed-language references) is planned for a future release. The AI can already handle author names in non-Latin scripts and references to non-English publications, but the in-text analysis is optimised for English prose.

### 10. What happens if CitePilot's AI is wrong?

AI analysis is advisory, not definitive. If you believe a flag is incorrect:
1. Click the **Ignore** button to dismiss the flag
2. Click the 👎 button to report the false positive (this helps us improve)
3. Use your own academic judgement — you know your document best

We are continuously improving our AI models based on user feedback.

### 11. Can my university get CitePilot for all students?

Yes. We offer institutional plans with centralised management, SSO integration, and usage analytics. Contact `institutions@citepilot.com` for a custom quote and pilot programme.

### 12. Is my data safe?

Yes. CitePilot takes data security seriously:
- All data is encrypted in transit (TLS 1.2+) and at rest (AES-256)
- Documents are automatically deleted within 36 hours
- We do not share your data with third parties (except our AI provider for analysis, with strict data usage controls)
- We are GDPR compliant and registered with the UK ICO
- Our infrastructure runs on Vercel and Railway, whose data centres are SOC 2 and ISO 27001 certified

### 13. Can I use CitePilot to check a journal submission?

Yes. Researchers and editors use CitePilot to verify citation consistency before submitting to journals. The Professional plan includes Crossref validation and retraction checking, which are especially valuable for ensuring all references are accurate and none have been retracted since you drafted the paper.

### 14. How do I cancel my subscription?

Open **PayPal**, find your active CitePilot subscription, and click **Cancel**. Your plan remains active until the end of your billing period, and no further charges will be made. Your usage reverts to the free tier.

### 15. What citation style should I use?

CitePilot doesn't prescribe a citation style — your institution, supervisor, or target journal determines which style to use. If you're unsure, check your assignment brief or journal submission guidelines. See the "How to choose the right style" section above for common defaults by discipline.

### 16. Why was my citation flagged as "possibly hallucinated"?

This means CitePilot could not verify the existence of the cited source against Crossref or DOI resolution. This can happen because:
- The source was generated by an AI tool and doesn't exist (a genuine hallucinated citation)
- The source is very new and hasn't been indexed yet
- The source is a type not typically indexed (government report, personal communication, unpublished thesis)
- The bibliographic details contain errors that prevent matching

CitePilot's AI considers these factors and assigns a confidence level. Always verify the source yourself if you're uncertain.

### 17. Can I use the API to integrate CitePilot with my own tools?

Yes. The Professional and Institutional plans include API access. You can send documents programmatically and receive structured citation check results in JSON format. API documentation is available at `api.citepilot.com/docs`. Rate limits apply per plan tier.

### 18. How do I report a bug or suggest a feature?

- **Bugs**: Email `support@citepilot.com` with a description of the issue, your browser and OS, and a screenshot if possible
- **Feature requests**: Email `feedback@citepilot.com` or use the in-app feedback widget on the results page
- **Security vulnerabilities**: Email `security@citepilot.com` — we take security reports seriously and respond within 24 hours

---

# 📬 Contact Us

| Purpose | Contact |
|---|---|
| General support | support@citepilot.com |
| Billing questions | support@citepilot.com |
| Institutional enquiries | institutions@citepilot.com |
| Feature requests | feedback@citepilot.com |
| Privacy / GDPR requests | privacy@citepilot.com |
| Security vulnerabilities | security@citepilot.com |
| Press / partnerships | press@citepilot.com |

**Response times**: We aim to respond to all support emails within 24 hours on business days. Institutional and security enquiries are prioritised.

---

*Last updated: 11 August 2026. Content is subject to change as features are added and improved.*
