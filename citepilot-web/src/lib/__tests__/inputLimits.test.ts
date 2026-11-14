import { describe, it, expect, beforeEach } from "vitest";
import {
  MAX_TEXT_CHARS,
  MAX_UPLOAD_BYTES,
  countDocumentWords,
  fileExtension,
  validateSelectedFile,
  validateText,
} from "../inputLimits";

function fakeFile(name: string, size: number): File {
  // jsdom/node File is available in Node 20+; size is derived from content, so
  // build a Blob-like object with an explicit size.
  return { name, size } as File;
}

describe("input limits and file validation", () => {
  beforeEach(() => {
    // no shared state
  });

  it("accepts every advertised format", () => {
    for (const name of ["a.docx", "b.pdf", "c.txt", "d.rtf", "e.bib"]) {
      expect(validateSelectedFile(fakeFile(name, 1024)).ok).toBe(true);
    }
  });

  it("rejects unsupported formats with an actionable message", () => {
    const result = validateSelectedFile(fakeFile("legacy.doc", 1024));
    expect(result.ok).toBe(false);
    expect(result.code).toBe("unsupported_format");
    expect(result.error).toMatch(/not supported/i);
    expect(result.error).toMatch(/DOCX/);
  });

  it("rejects empty files", () => {
    const result = validateSelectedFile(fakeFile("empty.docx", 0));
    expect(result.ok).toBe(false);
    expect(result.code).toBe("empty_file");
  });

  it("rejects oversized files and reports the limit", () => {
    const result = validateSelectedFile(fakeFile("big.pdf", MAX_UPLOAD_BYTES + 1));
    expect(result.ok).toBe(false);
    expect(result.code).toBe("file_too_large");
    expect(result.error).toContain("10 MB");
  });

  it("rejects pasted text over the character limit", () => {
    expect(validateText("a".repeat(MAX_TEXT_CHARS)).ok).toBe(true);
    const tooLong = validateText("a".repeat(MAX_TEXT_CHARS + 1));
    expect(tooLong.ok).toBe(false);
    expect(tooLong.code).toBe("file_too_large");
  });

  it("counts words and extensions predictably", () => {
    expect(countDocumentWords("one two  three\nfour")).toBe(4);
    expect(countDocumentWords("   ")).toBe(0);
    expect(fileExtension("Paper.FINAL.DOCX")).toBe(".docx");
    expect(fileExtension("noextension")).toBe("");
  });
});
