/**
 * Document parsing (.docx / .pdf / text) into body text, reference text, and
 * paragraph metadata.
 * Port of `citepilot-ai/src/citepilot_ai/services/document_parser.py`.
 */
import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import type { ParagraphMeta } from "./types";

export interface ParsedDocument {
  bodyText: string;
  refText: string;
  paragraphsMeta: ParagraphMeta[];
}

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function parseDocument(
  buffer: Buffer,
  mimeType: string,
  filename: string,
  mode = "full"
): Promise<ParsedDocument> {
  const mime = (mimeType || "").toLowerCase();
  const suffix = filename.includes(".")
    ? filename.slice(filename.lastIndexOf(".")).toLowerCase()
    : "";

  let rawText: string;
  let paragraphsMeta: ParagraphMeta[];

  if (mime === DOCX_MIME || suffix === ".docx") {
    ({ rawText, paragraphsMeta } = await parseDocxStructured(buffer));
  } else if (mime === "application/pdf" || suffix === ".pdf") {
    ({ rawText, paragraphsMeta } = await parsePdfStructured(buffer));
  } else {
    rawText = buffer.toString("utf-8");
    paragraphsMeta = parseTxtStructured(rawText);
  }

  const modeClean = (mode || "full").trim().toLowerCase();
  if (["reference_only", "references_only", "references"].includes(modeClean)) {
    return { bodyText: "", refText: rawText.trim(), paragraphsMeta };
  }

  const { bodyText, refText } = splitBodyAndReferences(rawText);
  return { bodyText, refText, paragraphsMeta };
}

export function splitBodyAndReferences(text: string): {
  bodyText: string;
  refText: string;
} {
  const patterns = [
    /(?:^|\n)#*\s*(?:\d+[\.\s]+|Chapter\s+\d+[:\s]+)?(?:References|Bibliography|Works\s+Cited|Reference\s+List)\b:?\s*(?:\n|$)/i,
    /(?:^|\n)#*\s*(?:\d+[\.\s]+)?(?:REFERENCES|BIBLIOGRAPHY|WORKS\s+CITED|REFERENCE\s+LIST)\b:?\s*(?:\n|$)/i,
  ];

  for (const pattern of patterns) {
    const matches = [...text.matchAll(new RegExp(pattern.source, "gi"))];
    if (matches.length > 0) {
      for (let i = matches.length - 1; i >= 0; i -= 1) {
        const match = matches[i];
        const startIdx = match.index ?? 0;
        if (startIdx > text.length * 0.15 || text.length < 2000) {
          const body = text.slice(0, startIdx).trim();
          const refs = text.slice(startIdx + match[0].length).trim();
          if (refs.length > 10) return { bodyText: body, refText: refs };
        }
      }
    }
  }

  return { bodyText: text.trim(), refText: text.trim() };
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(value: string): string {
  return decodeEntities(value.replace(/<[^>]+>/g, "")).trim();
}

async function parseDocxStructured(
  buffer: Buffer
): Promise<{ rawText: string; paragraphsMeta: ParagraphMeta[] }> {
  const { value: html } = await mammoth.convertToHtml({ buffer });

  const paragraphsMeta: ParagraphMeta[] = [];
  const textParts: string[] = [];
  let idx = 0;

  const blockRegex = /<(h[1-6]|p|li)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const txt = stripTags(match[2]);
    if (!txt) continue;
    const isHeading = tag.startsWith("h");
    const styleName = isHeading ? `Heading ${tag[1]}` : "Normal";
    paragraphsMeta.push({
      paragraph_index: idx,
      text: txt,
      style_name: styleName,
      is_heading: isHeading,
      char_count: txt.length,
    });
    textParts.push(txt);
    idx += 1;
  }

  return { rawText: textParts.join("\n\n"), paragraphsMeta };
}

async function parsePdfStructured(
  buffer: Buffer
): Promise<{ rawText: string; paragraphsMeta: ParagraphMeta[] }> {
  const paragraphsMeta: ParagraphMeta[] = [];
  const textParts: string[] = [];
  let idx = 0;

  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text: pages } = await extractText(pdf, { mergePages: false });
  const pageList = Array.isArray(pages) ? pages : [pages];

  pageList.forEach((pageText, pageIdx) => {
    const pageNum = pageIdx + 1;
    if (!pageText || !pageText.trim()) return;

    const lines = pageText.split("\n");
    let currentPara: string[] = [];

    const flush = () => {
      if (currentPara.length === 0) return;
      const pText = currentPara.join(" ");
      paragraphsMeta.push({
        paragraph_index: idx,
        text: pText,
        style_name: "Normal",
        is_heading: false,
        char_count: pText.length,
        page_number: pageNum,
      });
      textParts.push(pText);
      idx += 1;
    };

    for (const line of lines) {
      const lStr = line.trim();
      if (!lStr) {
        flush();
        currentPara = [];
      } else if (
        currentPara.length > 0 &&
        /[.:;]$/.test(currentPara[currentPara.length - 1]) &&
        (/^[A-Z]/.test(lStr) || /^[\[(1-9]/.test(lStr))
      ) {
        flush();
        currentPara = [lStr];
      } else {
        currentPara.push(lStr);
      }
    }
    flush();
  });

  return { rawText: textParts.join("\n\n"), paragraphsMeta };
}

export function parseTxtStructured(rawText: string): ParagraphMeta[] {
  const paragraphs = rawText.split("\n\n");
  const meta: ParagraphMeta[] = [];
  let idx = 0;
  for (const p of paragraphs) {
    const txt = p.trim();
    if (txt) {
      meta.push({
        paragraph_index: idx,
        text: txt,
        style_name: "Normal",
        is_heading: false,
        char_count: txt.length,
      });
      idx += 1;
    }
  }
  return meta;
}
