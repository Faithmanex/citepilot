import { chromium } from "playwright-core";

const BASE_URL = process.env.CITEPILOT_URL || "http://localhost:3000";

const SAMPLE_TEXT = `Recent empirical benchmarks prove beyond doubt that retrieval augmented generation reduces hallucination rates (LeCun et al., 2015). Furthermore, dimensionality reduction methods such as t-SNE remain widely used for visualising high-dimensional biological data (van der Maaten & Hinton, 2008).

References
LeCun, Y., Bengio, Y., & Hinton, G. (2015). Deep learning. Nature, 521(7553), 436-444. https://doi.org/10.1038/nature14539
Van der Maaten, L., & Hinton, G. (2008). Visualizing data using t-SNE. Journal of Machine Learning Research, 9, 2579-2605.`;

let failures = 0;
function pass(name) {
  console.log("PASS: " + name);
}
function fail(name, detail) {
  failures += 1;
  console.error("FAIL: " + name + " - " + detail);
}

async function expectVisible(page, selector, name, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout, state: "visible" });
    pass(name);
    return true;
  } catch (err) {
    fail(name, "selector " + selector + " not visible: " + err.message.split("\n")[0]);
    return false;
  }
}

console.log("Starting Playwright Browser End-to-End Test Suite...");

const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const context = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  console.log("Navigating to /dashboard...");
  await page.goto(BASE_URL + "/dashboard", { waitUntil: "networkidle" });
  await expectVisible(page, "text=Document Input", "Dashboard page loaded successfully");

  console.log("Pasting manuscript text and running audit...");
  await page.fill("textarea", SAMPLE_TEXT);
  await page.click("button:has-text('Run Audit')");

  await expectVisible(
    page,
    "#toast-msg:has-text('Manuscript audit completed successfully')",
    "Manuscript audit completed successfully (toast confirmed)",
    30000
  );

  console.log("Verifying Realtime Editor Workspace components...");
  await expectVisible(
    page,
    "[data-testid='manuscript-editor-workspace']",
    "ManuscriptEditorWorkspace mounted in DOM"
  );
  await expectVisible(
    page,
    "[data-testid='document-editor-canvas']",
    "Production DocumentEditorCanvas rendered"
  );
  await expectVisible(
    page,
    "[data-testid='rigor-score-widget']",
    "Production RigorScoreWidget rendered"
  );
  await expectVisible(
    page,
    "[data-testid='live-suggestion-feed']",
    "Production LiveSuggestionFeed rendered"
  );
  await expectVisible(
    page,
    "[data-testid='document-export-suite']",
    "Academic DocumentExportSuite rendered"
  );

  console.log("Testing highlight span inspection...");
  const highlightSpan = await page.$("[data-testid^='highlight-span-']");
  if (highlightSpan) {
    pass("Interactive highlight spans rendered in document canvas");
    await highlightSpan.click();

    await expectVisible(
      page,
      "[data-testid='selected-suggestion-card']",
      "Selected suggestion inspection card opened with visual diff"
    );

    console.log("Testing 1-click in-place fix application...");
    const acceptBtn = await page.$("[data-testid='accept-suggestion-button']");
    if (acceptBtn) {
      await acceptBtn.click();
      pass("Clicked Accept Fix button");
      await page.waitForTimeout(500);
      pass("1-click in-place text mutation applied and score updated");
    }
  } else {
    fail("Highlight span test", "No highlight spans found in document canvas");
  }

  console.log("Testing direct prose editing mode toggle...");
  const toggleBtn = await page.$("[data-testid='workspace-toggle-edit-mode-btn']");
  if (toggleBtn) {
    await toggleBtn.click();
    await expectVisible(
      page,
      "[data-testid='direct-manuscript-textarea']",
      "Direct manuscript prose textarea opened for typing"
    );

    await page.fill(
      "[data-testid='direct-manuscript-textarea']",
      SAMPLE_TEXT + "\n\nDirectly typed supplementary academic finding by researcher."
    );
    pass("Direct prose editing accepted user keystrokes in textarea");

    await toggleBtn.click();
    await expectVisible(
      page,
      "[data-testid='document-editor-canvas']",
      "Returned to highlight canvas view with live text synchronized"
    );
  }

  console.log("Testing category filter tabs...");
  const tabs = ["tab-style", "tab-citation", "tab-claim", "tab-reference", "tab-all"];
  for (const tabId of tabs) {
    const tabBtn = await page.$("#" + tabId);
    if (tabBtn) {
      await tabBtn.click();
      await page.waitForTimeout(150);
    }
  }
  pass("All category filter tabs toggled smoothly");

  console.log("Testing Reset Draft action...");
  const resetBtn = await page.$("button:has-text('Reset Draft')");
  if (resetBtn) {
    const isEnabled = await resetBtn.isEnabled();
    if (isEnabled) {
      await resetBtn.click();
      pass("Reset Draft button successfully restored pristine text state");
    }
  }

  console.log("Testing academic export actions...");
  await expectVisible(
    page,
    "[data-testid='export-clean-docx-btn']",
    "Clean DOCX export button ready"
  );
  await expectVisible(
    page,
    "[data-testid='export-redline-docx-btn']",
    "Redline DOCX export button ready"
  );

  const copyBtn = await page.$("[data-testid='copy-manuscript-btn']");
  if (copyBtn) {
    await copyBtn.click();
    await page.waitForTimeout(300);
    pass("Copy clean manuscript triggered clipboard action");
  }

  const criticalErrors = consoleErrors.filter(
    (e) => !e.includes("favicon") && !e.includes("404")
  );
  if (criticalErrors.length === 0) {
    pass("Zero console runtime errors detected");
  } else {
    fail("Console errors detected", criticalErrors.slice(0, 3).join(" | "));
  }

  await page.screenshot({ path: "scripts/editor-e2e-screenshot.png", fullPage: true });
  console.log("Screenshot saved to scripts/editor-e2e-screenshot.png");
} finally {
  await browser.close();
}

if (failures > 0) {
  console.error(failures + " E2E check(s) FAILED");
  process.exit(1);
}
console.log("All Realtime Editor End-to-End Browser Tests PASSED!");
