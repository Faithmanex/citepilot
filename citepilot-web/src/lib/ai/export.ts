/**
 * Document export: clean/redline DOCX and diagnostic PDF reports.
 *
 * Python used python-docx + reportlab; here we use `docx` + `pdf-lib` (pure JS,
 * serverless-friendly).
 */
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { JsonObject } from "./types";

const ACADEMIC_HEADINGS = new Set([
  "abstract", "introduction", "background", "literature review",
  "methods", "methodology", "data and methods", "results",
  "discussion", "limitations", "conclusion", "conclusions",
  "references", "bibliography", "works cited", "acknowledgments",
  "appendix", "appendices",
]);

/* ------------------------------------------------------------------ */
/* DOCX                                                               */
/* ------------------------------------------------------------------ */

export async function generateCleanDocx(text: string): Promise<Buffer> {
  const children: Paragraph[] = [];
  const paragraphs = text ? text.split("\n\n") : [];

  for (const para of paragraphs) {
    const pStr = para.trim();
    if (!pStr) continue;

    if (pStr.startsWith("### ")) {
      children.push(new Paragraph({ text: pStr.slice(4).trim(), heading: HeadingLevel.HEADING_3 }));
    } else if (pStr.startsWith("## ")) {
      children.push(new Paragraph({ text: pStr.slice(3).trim(), heading: HeadingLevel.HEADING_2 }));
    } else if (pStr.startsWith("# ")) {
      children.push(new Paragraph({ text: pStr.slice(2).trim(), heading: HeadingLevel.HEADING_1 }));
    } else if (ACADEMIC_HEADINGS.has(pStr.toLowerCase()) && pStr.length < 60) {
      children.push(new Paragraph({ text: pStr, heading: HeadingLevel.HEADING_1 }));
    } else {
      children.push(new Paragraph({ text: pStr }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

export async function generateRedlineDocx(
  text: string,
  analysisData: JsonObject
): Promise<Buffer> {
  const warnings = (analysisData["style_warnings"] as JsonObject[]) || [];
  const citations = (analysisData["citations"] as JsonObject[]) || [];
  const claims = (analysisData["uncited_claims"] as JsonObject[]) || [];

  const warningMap = new Map<string, JsonObject>();
  for (const w of warnings) {
    const target = String(w["target_text"] || "").trim();
    if (target) warningMap.set(target, w);
  }

  const children: Paragraph[] = [
    new Paragraph({
      text: "CitePilot Redline Annotated Manuscript",
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph(
      `Audit Summary: ${warnings.length} Style Warnings, ${citations.length} In-Text Citations, and ${claims.length} Uncited Claims Detected.`
    ),
    new Paragraph("----------------------------------------------------------------------"),
  ];

  const paragraphs = text ? text.split("\n\n") : [];
  for (const paraText of paragraphs) {
    const pStr = paraText.trim();
    if (!pStr) continue;

    const matched: JsonObject[] = [];
    for (const [target, w] of warningMap.entries()) {
      if (pStr.includes(target)) matched.push(w);
    }

    if (matched.length > 0) {
      const runs: TextRun[] = [new TextRun({ text: pStr, highlight: "yellow" })];
      for (const mw of matched) {
        runs.push(
          new TextRun({
            text: `  [STYLE WARNING (${mw["code"]}): ${mw["message"]}]`,
            bold: true,
            highlight: "magenta",
          })
        );
      }
      children.push(new Paragraph({ children: runs }));
    } else {
      children.push(new Paragraph({ text: pStr }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

/* ------------------------------------------------------------------ */
/* PDF                                                                */
/* ------------------------------------------------------------------ */

export async function generatePdfReport(analysisData: JsonObject): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 36;
  const maxWidth = pageWidth - margin * 2;

  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const ensureSpace = (needed: number) => {
    if (y - needed < margin) {
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  const writeParagraph = (
    text: string,
    opts: { size: number; font: typeof helv; color: ReturnType<typeof rgb>; gapAfter: number }
  ) => {
    const lines = wrapText(pdfSafe(text), opts.font, opts.size, maxWidth);
    const lineHeight = opts.size * 1.4;
    for (const line of lines) {
      ensureSpace(lineHeight);
      page.drawText(line, {
        x: margin,
        y: y - opts.size,
        size: opts.size,
        font: opts.font,
        color: opts.color,
      });
      y -= lineHeight;
    }
    y -= opts.gapAfter;
  };

  const titleColor = rgb(0.118, 0.227, 0.541); // #1E3A8A
  const h2Color = rgb(0.059, 0.09, 0.165); // #0F172A
  const bodyColor = rgb(0.2, 0.255, 0.333); // #334155

  writeParagraph("CitePilot Diagnostic Citation Audit Report", {
    size: 20,
    font: helvBold,
    color: titleColor,
    gapAfter: 12,
  });

  const citations = (analysisData["citations"] as unknown[]) || [];
  const refs = (analysisData["references"] as JsonObject[]) || [];
  const warnings = (analysisData["style_warnings"] as JsonObject[]) || [];
  const recency = (analysisData["recency"] as JsonObject) || {};
  const checks = (analysisData["checks"] as JsonObject[]) || [];
  const auditStatus = String(analysisData["status"] || "completed");
  const auditMode = String(analysisData["mode"] || "full");
  const auditStyle = String(analysisData["citation_style"] || "unspecified");
  const requestId = String(analysisData["request_id"] || "not recorded");
  const elapsed = analysisData["elapsed_seconds"];

  writeParagraph(
    `Audit context: ${auditStatus.toUpperCase()} · ${auditMode === "reference_only" ? "references only" : "whole document"} · ${auditStyle} · request ${requestId}${
      typeof elapsed === "number" ? ` · ${elapsed}s` : ""
    }`,
    { size: 9, font: helv, color: bodyColor, gapAfter: 6 }
  );

  writeParagraph(
    `Summary: Parsed ${citations.length} citations, ${refs.length} reference entries, and ${warnings.length} style warnings.`,
    { size: 10, font: helv, color: bodyColor, gapAfter: 10 }
  );

  // Report which checks ran. An unavailable check must never read as "clean".
  if (checks.length > 0) {
    writeParagraph("Checks Performed", {
      size: 14,
      font: helvBold,
      color: h2Color,
      gapAfter: 6,
    });
    for (const check of checks) {
      const status = String(check["status"] || "unknown");
      const line = `- ${String(check["label"] || check["name"] || "Check")}: ${status.toUpperCase()}${
        check["message"] ? ` — ${String(check["message"])}` : ""
      }`;
      writeParagraph(line, {
        size: 9,
        font: helv,
        color:
          status === "completed" ? bodyColor : rgb(0.576, 0.396, 0.059),
        gapAfter: 2,
      });
    }
    writeParagraph(
      auditStatus === "partial"
        ? "This audit is PARTIAL. Findings for unavailable checks are missing, not clean."
        : "Every requested check completed.",
      {
        size: 9,
        font: helvBold,
        color: auditStatus === "partial" ? rgb(0.576, 0.396, 0.059) : bodyColor,
        gapAfter: 10,
      }
    );
  }

  const unmatched = (analysisData["citations"] as JsonObject[] | undefined)?.filter(
    (c) => c["status"] === "no_match"
  ).length;
  const orphaned = refs.filter((r) => r["status"] === "orphaned").length;
  const unverified = refs.filter((r) => {
    const status = (r["crossref_validation"] as JsonObject | undefined)?.["status"];
    return status === "verification_unavailable" || status === "not_found";
  }).length;

  writeParagraph("Citation and Reference Totals", {
    size: 14,
    font: helvBold,
    color: h2Color,
    gapAfter: 6,
  });
  writeParagraph(
    `Unmatched citations: ${unmatched ?? 0} · Orphaned references (never cited): ${orphaned} · References whose metadata could not be verified: ${unverified}`,
    { size: 10, font: helv, color: bodyColor, gapAfter: 10 }
  );

  if (unverified > 0) {
    writeParagraph(
      "Unverified references are not confirmed correct. Their metadata checks did not complete.",
      { size: 9, font: helvBold, color: rgb(0.576, 0.396, 0.059), gapAfter: 10 }
    );
  }

  if (warnings.length > 0) {
    writeParagraph("Highest-Priority Findings", {
      size: 14,
      font: helvBold,
      color: h2Color,
      gapAfter: 6,
    });
    for (const w of warnings.slice(0, 15)) {
      writeParagraph(`- [${w["code"] || "STYLE"}] ${w["message"] || ""}`, {
        size: 10,
        font: helv,
        color: bodyColor,
        gapAfter: 2,
      });
    }
  }

  const retracted = refs.filter(
    (r) =>
      r["status"] === "retracted" ||
      (r["retraction_info"] as JsonObject | undefined)?.["is_retracted"]
  );
  if (retracted.length > 0) {
    writeParagraph("Retracted Sources Flagged", {
      size: 14,
      font: helvBold,
      color: h2Color,
      gapAfter: 6,
    });
    for (const r of retracted) {
      writeParagraph(`- RETRACTED: ${r["raw_entry"] || ""}`, {
        size: 10,
        font: helv,
        color: rgb(0.6, 0.1, 0.1),
        gapAfter: 2,
      });
    }
  }

  writeParagraph("Publication Recency Breakdown", {
    size: 14,
    font: helvBold,
    color: h2Color,
    gapAfter: 6,
  });
  writeParagraph(
    `Within 5 Years: ${recency["within_5_years_percent"] ?? 0}% | Within 10 Years: ${
      recency["within_10_years_percent"] ?? 0
    }% | Avg Age: ${recency["average_source_age_years"] ?? "N/A"} yrs`,
    { size: 10, font: helv, color: bodyColor, gapAfter: 2 }
  );

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

/**
 * The standard PDF fonts are WinAnsi-encoded. Replace characters that encoding
 * cannot represent so a reference title in another script cannot make the whole
 * report fail to generate.
 */
function pdfSafe(text: string): string {
  const replacements: Record<string, string> = {
    "\u2018": "'",
    "\u2019": "'",
    "\u201c": '"',
    "\u201d": '"',
    "\u2013": "-",
    "\u2014": "-",
    "\u2026": "...",
    "\u00a0": " ",
  };
  return String(text)
    .replace(/[\u2018\u2019\u201c\u201d\u2013\u2014\u2026\u00a0]/g, (ch) => replacements[ch] ?? "")
    .replace(/[^\u0000-\u00ff]/g, "?");
}

function wrapText(  text: string,
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  size: number,
  maxWidth: number
): string[] {
  const words = String(text).replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}
