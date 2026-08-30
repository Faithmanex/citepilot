import { describe, it, expect } from "vitest";
import { parseWordXmlToText, parseWordXmlToSemantic, extractTextFromDocx } from "../docxExtractor";

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

    expect(extracted).toContain("Introduction to Gene Editing");
    expect(extracted).not.toContain("# Introduction");
    expect(extracted).toContain("Recent advances in CRISPR technology have accelerated precision medicine (Urnov et al. 2010).");
    expect(extracted).toContain("Methodological Rigor");
    expect(extracted).not.toContain("## Methodological");
    expect(extracted).toContain("We audited 450 clinical citations across peer-reviewed publications.");
  });

  it("extracts rich semantic HTML with headings, bold, and italic runs", () => {
    const mockWordXml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
            <w:r><w:t>Chapter 1: Introduction</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr><w:pStyle w:val="Heading2"/></w:pPr>
            <w:r><w:t>1.1 Background of the Study</w:t></w:r>
          </w:p>
          <w:p>
            <w:r><w:t>The </w:t></w:r>
            <w:r><w:rPr><w:b/></w:rPr><w:t>authentication system</w:t></w:r>
            <w:r><w:t> is an </w:t></w:r>
            <w:r><w:rPr><w:i/></w:rPr><w:t>important factor</w:t></w:r>
            <w:r><w:t> in security.</w:t></w:r>
          </w:p>
        </w:body>
      </w:document>
    `;

    const semantic = parseWordXmlToSemantic(mockWordXml);

    // Verify clean text output
    expect(semantic.text).toContain("Chapter 1: Introduction");
    expect(semantic.text).not.toContain("# Chapter 1");
    expect(semantic.text).toContain("1.1 Background of the Study");
    expect(semantic.text).not.toContain("## 1.1");
    expect(semantic.text).toContain("The authentication system is an important factor in security.");

    // Verify semantic HTML output
    expect(semantic.html).toContain("<h1>Chapter 1: Introduction</h1>");
    expect(semantic.html).toContain("<h2>1.1 Background of the Study</h2>");
    expect(semantic.html).toContain("<strong>authentication system</strong>");
    expect(semantic.html).toContain("<em>important factor</em>");
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
