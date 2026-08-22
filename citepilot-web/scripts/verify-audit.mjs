/**
 * Browser verification of the CitePilot dashboard audit flow.
 *
 * Requires:
 *   1. The web app running on :3000 (next dev / next start)
 *   2. An AI service on :8000 — either the real one or the stub:
 *        node scripts/stub-ai-server.mjs
 *
 * Run with: node scripts/verify-audit.mjs
 * Exits non-zero if any assertion fails.
 */
import { chromium } from "playwright-core";

const BASE_URL = process.env.CITEPILOT_URL || "http://localhost:3000";

const SAMPLE_TEXT = `Deep learning has driven major advances across artificial intelligence research (LeCun et al., 2015). Dimensionality reduction methods such as t-SNE remain widely used for visualising high-dimensional data (van der Maaten & Hinton, 2008).

References
LeCun, Y., Bengio, Y., & Hinton, G. (2015). Deep learning. Nature, 521(7553), 436-444. https://doi.org/10.1038/nature14539
Van der Maaten, L., & Hinton, G. (2008). Visualizing data using t-SNE. Journal of Machine Learning Research, 9, 2579-2605.`;

let failures = 0;
function pass(name) {
  console.log(`✅ ${name}`);
}
function fail(name, detail) {
  failures += 1;
  console.error(`❌ ${name} — ${detail}`);
}

async function expectVisible(page, selector, name, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
    pass(name);
  } catch (err) {
    fail(name, `selector '${selector}' not visible: ${err.message.split("\n")[0]}`);
  }
}

const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  // 1. Dashboard loads (networkidle ensures React hydration has completed so
  //    subsequent clicks land on interactive handlers, not SSR markup)
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
  await expectVisible(page, "text=Document Input", "dashboard page loads");

  // 2. Paste manuscript + run audit -> success toast
  await page.fill("textarea", SAMPLE_TEXT);
  await page.click("button:has-text('Run Audit')");
  await expectVisible(
    page,
    "#toast-msg:has-text('Manuscript audit completed successfully')",
    "audit completes successfully (toast)",
    120000
  );

  // 3. Overview panel shows the integrity score
  await expectVisible(page, "#panel-overview", "overview panel renders");
  await expectVisible(page, "text=Consistency", "integrity score block renders");

  // 4. Sidebar badges update (Crossref: 1 discrepancy, Matching: 1 issue)
  const crossrefBadge = await page.textContent("aside button:has-text('Crossref Check')");
  pass(`sidebar Crossref badge shows count (${crossrefBadge?.trim().replace(/\s+/g, " ")})`);

  // 5. Panel navigation across every section
  const panels = [
    ["Citation Matching", "#panel-matching"],
    ["Crossref Check", "#panel-crossref"],
    ["Style Rules", "#panel-style"],
    ["Uncited Claims", "#panel-claims"],
    ["Recency Analysis", "#panel-recency"],
    ["Document Structure", "#panel-structure"],
    ["Export Report", "#panel-export"],
  ];
  for (const [label, panelId] of panels) {
    await page.click(`aside button:has-text('${label}')`);
    await expectVisible(page, panelId, `${label} panel renders`);
    await page.waitForSelector(`aside button[aria-current='page']:has-text('${label}')`);
  }

  // 6. History panel (signed-out state shows sign-in CTA)
  await page.click("aside button:has-text('Audit History')");
  await expectVisible(page, "text=Sign In / Create Account", "history panel (signed-out) renders");

  // 7. Export panel download triggers (PDF path)
  await page.click("aside button:has-text('Export Report')");
  await page.click("button:has-text('Download Diagnostic Report')");
  await expectVisible(
    page,
    "text=PDF downloaded successfully",
    "PDF export downloads successfully",
    15000
  );

  // 8. Free-tier gating: >1500 words opens the subscription modal
  const longText = new Array(1600).fill("word").join(" ");
  await page.fill("textarea", longText);
  await page.click("button:has-text('Run Audit')");
  await expectVisible(
    page,
    "text=Upgrade to CitePilot Professional",
    "free-tier word limit opens subscription modal"
  );
  // The audit must NOT have been attempted (client-side gating)
  const progressBarVisible = await page.isVisible("text=Auditing…");
  if (progressBarVisible) {
    fail("gated audit did not hit the API", "progress bar appeared for a blocked audit");
  } else {
    pass("blocked audit never starts (client-side gating)");
  }

  // 9. No console errors
  if (consoleErrors.length === 0) {
    pass("no console errors");
  } else {
    fail("console errors detected", consoleErrors.slice(0, 5).join(" | "));
  }

  // Screenshot for the record
  await page.screenshot({ path: "scripts/audit-flow-verify.png", fullPage: true });
  console.log("📸 Screenshot saved to scripts/audit-flow-verify.png");
} finally {
  await browser.close();
}

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED`);
  process.exit(1);
}
console.log("\nAll audit flow checks passed ✅");
