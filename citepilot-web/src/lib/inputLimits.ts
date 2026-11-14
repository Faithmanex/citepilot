/**
 * Client-side input limits.
 *
 * These mirror the server defaults in `src/lib/ai/config.ts`. The server remains
 * authoritative (it can be configured with environment variables); the client
 * uses these values to explain limits before submission and to reject obvious
 * problems without a round trip.
 */
export const MAX_UPLOAD_MB = 10;
export const MAX_TEXT_CHARS = 200_000;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
export const FREE_TIER_WORD_LIMIT = 1500;

export const SUPPORTED_EXTENSIONS = [".docx", ".pdf", ".txt", ".rtf", ".bib"] as const;

export const SUPPORTED_FORMAT_LABEL = "DOCX, PDF, TXT, RTF, or BibTeX (.bib)";

export function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

export interface FileValidation {
  ok: boolean;
  error?: string;
  code?: "unsupported_format" | "empty_file" | "file_too_large";
}

/** Pre-flight validation for a selected or dropped file. */
export function validateSelectedFile(file: File): FileValidation {
  const ext = fileExtension(file.name);
  if (!SUPPORTED_EXTENSIONS.includes(ext as (typeof SUPPORTED_EXTENSIONS)[number])) {
    return {
      ok: false,
      code: "unsupported_format",
      error: `${ext || "That file type"} is not supported. Use ${SUPPORTED_FORMAT_LABEL}.`,
    };
  }
  if (file.size === 0) {
    return {
      ok: false,
      code: "empty_file",
      error: "That file is empty. Choose a file that contains your manuscript or reference list.",
    };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      ok: false,
      code: "file_too_large",
      error: `That file is ${mb} MB. The limit is ${MAX_UPLOAD_MB} MB.`,
    };
  }
  return { ok: true };
}

/** Text-limit validation for pasted text. */
export function validateText(text: string): FileValidation {
  if (text.length > MAX_TEXT_CHARS) {
    return {
      ok: false,
      code: "file_too_large",
      error: `This text is ${text.length.toLocaleString()} characters. The limit is ${MAX_TEXT_CHARS.toLocaleString()}.`,
    };
  }
  return { ok: true };
}

/** Rough word count used for the free-tier limit hint. */
export function countDocumentWords(text: string): number {
  const cleaned = text.trim().replace(/\s+/g, " ");
  return cleaned ? cleaned.split(" ").length : 0;
}
