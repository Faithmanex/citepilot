/**
 * Document export: clean/redline DOCX and diagnostic PDF reports.
 * Port of `citepilot-ai/src/citepilot_ai/services/export_service.py`.
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
    const lines = wrapText(text, opts.font, opts.size, maxWidth);
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

  writeParagraph(
    `Summary: Parsed ${citations.length} citations, ${refs.length} reference entries, and ${warnings.length} style warnings.`,
    { size: 10, font: helv, color: bodyColor, gapAfter: 10 }
  );

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

function wrapText(
  text: string,
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
