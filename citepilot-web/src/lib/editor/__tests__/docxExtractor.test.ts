import { describe, it, expect } from "vitest";
import { parseWordXmlToText, extractTextFromDocx } from "../docxExtractor";

describe("Realtime OpenXML DOCX Extractor", () => {
  it("extracts paragraphs and runs from Word OpenXML accurately", () => {
    const mockWordXml = `
      <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:pPr>
              <w:pStyle w:val="Heading1"/>
            </w:pPr>
            <w:r>
              <w:t>Introduction to Gene Editing</w:t>
            </w:r>
          </w:p>
          <w:p>
            <w:r>
              <w:t>Recent advances in CRISPR technology </w:t>
            </w:r>
            <w:r>
              <w:t>have accelerated precision medicine (Urnov et al. 2010).</w:t>
            </w:r>
          </w:p>
          <w:p>
            <w:pPr>
              <w:pStyle w:val="Heading2"/>
            </w:pPr>
            <w:r>
              <w:t>Methodological Rigor</w:t>
            </w:r>
          </w:p>
          <w:p>
            <w:r>
              <w:t>We audited 450 clinical citations across peer-reviewed publications.</w:t>
            </w:r>
          </w:p>
        </w:body>
      </w:document>
    `;

    const extracted = parseWordXmlToText(mockWordXml);

    expect(extracted).toContain("# Introduction to Gene Editing");
    expect(extracted).toContain("Recent advances in CRISPR technology have accelerated precision medicine (Urnov et al. 2010).");
    expect(extracted).toContain("## Methodological Rigor");
    expect(extracted).toContain("We audited 450 clinical citations across peer-reviewed publications.");
  });

  it("handles empty or whitespace-only input safely", () => {
    expect(parseWordXmlToText("")).toBe("");
    expect(parseWordXmlToText("<w:document><w:body></w:body></w:document>")).toBe("");
  });

  it("handles truncated or invalid files gracefully without unhandled exceptions", async () => {
    const invalidBlob = new Blob([new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00])]);
    const result = await extractTextFromDocx(invalidBlob);
    expect(result).toBe("");
  });

  it("handles empty blob safely", async () => {
    const emptyBlob = new Blob([]);
    const result = await extractTextFromDocx(emptyBlob);
    expect(result).toBe("");
  });
});
