/**
 * Document parsing (.docx / .pdf / text) into body text, reference text, and
 * paragraph metadata.
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

const TEXT_EXTENSIONS = new Set([".txt", ".rtf", ".bib", ".text", ".md"]);

export class UnsupportedFileTypeError extends Error {
  constructor(filename: string) {
    super(`Unsupported file type for "${filename}".`);
    this.name = "UnsupportedFileTypeError";
  }
}

/**
 * Converts RTF to plain text. This is deliberately a text extractor, not a
 * layout renderer: it handles the constructs that appear in manuscript RTFs
 * (paragraphs, tabs, escaped characters, unicode escapes) and drops the rest.
 */
export function rtfToPlainText(rtf: string): string {
  let out = "";
  let depth = 0;
  // Ignore destinations such as {\*\generator ...} and {\fonttbl ...}.
  let skippingDepth = -1;
  let i = 0;
  while (i < rtf.length) {
    const ch = rtf[i];
    if (ch === "\\") {
      const next = rtf[i + 1];
      if (next === "*") {
        skippingDepth = depth;
        i += 2;
        continue;
      }
      if (next === "'") {
        const hex = rtf.slice(i + 2, i + 4);
        const code = parseInt(hex, 16);
        if (!Number.isNaN(code) && skippingDepth === -1) {
          out += String.fromCharCode(code);
        }
        i += 4;
        continue;
      }
      if (next === "u") {
        const match = /^\\u(-?\d+)\s?\??/.exec(rtf.slice(i));
        if (match) {
          const code = Number(match[1]);
          if (skippingDepth === -1) {
            out += String.fromCharCode(code < 0 ? code + 65536 : code);
          }
          i += match[0].length;
          continue;
        }
      }
      const word = /^\\([a-zA-Z]+)(-?\d+)?\s?/.exec(rtf.slice(i));
      if (word) {
        if (skippingDepth === -1) {
          if (word[1] === "par" || word[1] === "line") out += "\n";
          else if (word[1] === "tab") out += "\t";
          else if (word[1] === "emdash") out += "—";
          else if (word[1] === "endash") out += "–";
          else if (word[1] === "lquote") out += "“";
          else if (word[1] === "rquote") out += "”";
        }
        if (["fonttbl", "colortbl", "stylesheet", "info", "pict", "header", "footer"].includes(word[1])) {
          skippingDepth = depth;
        }
        i += word[0].length;
        continue;
      }
      // Escaped literal (\\ \{ \}).
      if (skippingDepth === -1 && next) out += next;
      i += 2;
      continue;
    }
    if (ch === "{") {
      depth += 1;
      i += 1;
      continue;
    }
    if (ch === "}") {
      if (skippingDepth === depth) skippingDepth = -1;
      depth = Math.max(0, depth - 1);
      i += 1;
      continue;
    }
    if (skippingDepth === -1 && ch !== "\r") out += ch;
    i += 1;
  }
  return out
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

/**
 * BibTeX to readable reference-list text. Entry types and field names are kept
 * so the reference parser can see author/year/title metadata.
 */
export function bibtexToPlainText(bib: string): string {
  const entries = bib.split(/@(?=[a-zA-Z]+\s*[{(])/g).filter(Boolean);
  const lines: string[] = [];
  for (const entry of entries) {
    const typeMatch = /^([a-zA-Z]+)\s*[{(]\s*([^,\s]*)/.exec(entry);
    if (!typeMatch) continue;
    const fields: Record<string, string> = {};
    const body = entry.slice(typeMatch[0].length);
    const fieldRegex = /([a-zA-Z]+)\s*=\s*(\{(?:[^{}]|\{[^{}]*\})*\}|"[^"]*"|[^,]+)/g;
    let match: RegExpExecArray | null;
    while ((match = fieldRegex.exec(body)) !== null) {
      const key = match[1].toLowerCase();
      let value = match[2].trim();
      if (value.startsWith("{") && value.endsWith("}")) value = value.slice(1, -1);
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      fields[key] = value.replace(/\s+/g, " ").trim();
    }
    const authors = (fields.author || "")
      .split(/\s+and\s+/i)
      .map((a) => a.replace(/[{}]/g, "").trim())
      .filter(Boolean);
    const parts = [
      authors.length ? `${authors.join("; ")}.` : "",
      fields.year ? `(${fields.year}).` : "",
      fields.title ? `${fields.title}.` : "",
      fields.journal || fields.booktitle ? `${fields.journal || fields.booktitle}.` : "",
      fields.volume ? `${fields.volume}${fields.number ? `(${fields.number})` : ""}.` : "",
      fields.pages ? `${fields.pages}.` : "",
      fields.doi ? `https://doi.org/${fields.doi}` : "",
    ].filter(Boolean);
    if (parts.length) lines.push(parts.join(" "));
  }
  return lines.join("\n\n");
}

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
  } else if (suffix === ".rtf" || mime === "application/rtf" || mime === "text/rtf") {
    rawText = rtfToPlainText(buffer.toString("utf-8"));
    paragraphsMeta = parseTxtStructured(rawText);
  } else if (suffix === ".bib") {
    rawText = bibtexToPlainText(buffer.toString("utf-8"));
    paragraphsMeta = parseTxtStructured(rawText);
  } else if (
    TEXT_EXTENSIONS.has(suffix) ||
    mime.startsWith("text/") ||
    mime === "application/x-bibtex"
  ) {
    rawText = buffer.toString("utf-8");
    paragraphsMeta = parseTxtStructured(rawText);
  } else {
    throw new UnsupportedFileTypeError(filename);
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
