/**
 * Client-Side Realtime OpenXML (.docx) Text Extractor.
 * Parses Microsoft Word OpenXML packages directly in the browser in realtime using standard Web DecompressionStream.
 * Extracts paragraphs, headings (H1-H3), and runs from word/document.xml with zero external dependencies.
 */

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export function parseWordXmlToText(xml: string): string {
  if (!xml) return "";

  // Split by paragraph tags <w:p>
  const paragraphRegex = /<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/gi;
  const paragraphs: string[] = [];
  let pMatch: RegExpExecArray | null;

  while ((pMatch = paragraphRegex.exec(xml)) !== null) {
    const pContent = pMatch[1];

    // Detect heading level from <w:pStyle w:val="Heading1" .../>
    let headingPrefix = "";
    const styleMatch = /<w:pStyle[^>]*w:val="([^"]+)"/i.exec(pContent);
    if (styleMatch) {
      const val = styleMatch[1].toLowerCase();
      if (val === "heading1" || val === "title") {
        headingPrefix = "# ";
      } else if (val === "heading2") {
        headingPrefix = "## ";
      } else if (val === "heading3") {
        headingPrefix = "### ";
      }
    }

    // Replace tabs and breaks before extracting text runs
    const normalizedRuns = pContent
      .replace(/<w:tab(?:\s[^>]*)?\/>/gi, " ")
      .replace(/<w:br(?:\s[^>]*)?\/>/gi, "\n")
      .replace(/<w:cr(?:\s[^>]*)?\/>/gi, "\n");

    // Extract text runs <w:t>
    const textRegex = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/gi;
    let textMatch: RegExpExecArray | null;
    let paraText = "";

    while ((textMatch = textRegex.exec(normalizedRuns)) !== null) {
      paraText += decodeXmlEntities(textMatch[1]);
    }

    const trimmed = paraText.trim();
    if (trimmed) {
      paragraphs.push(headingPrefix + trimmed);
    }
  }

  return paragraphs.join("\n\n");
}

export async function extractTextFromDocx(file: File | Blob): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Scan ZIP Local File Headers: Signature 0x50, 0x4b, 0x03, 0x04 (PK\x03\x04)
    let offset = 0;
    while (offset < bytes.length - 30) {
      if (
        bytes[offset] === 0x50 &&
        bytes[offset + 1] === 0x4b &&
        bytes[offset + 2] === 0x03 &&
        bytes[offset + 3] === 0x04
      ) {
        const compressionMethod = bytes[offset + 8] | (bytes[offset + 9] << 8);
        const compressedSize =
          bytes[offset + 18] |
          (bytes[offset + 19] << 8) |
          (bytes[offset + 20] << 16) |
          (bytes[offset + 21] << 24);
        const fileNameLen = bytes[offset + 26] | (bytes[offset + 27] << 8);
        const extraFieldLen = bytes[offset + 28] | (bytes[offset + 29] << 8);

        const fileNameBytes = bytes.subarray(offset + 30, offset + 30 + fileNameLen);
        const fileName = new TextDecoder().decode(fileNameBytes);

        const dataOffset = offset + 30 + fileNameLen + extraFieldLen;

        if (fileName === "word/document.xml") {
          const compressedData = bytes.subarray(dataOffset, dataOffset + compressedSize);
          let xmlText = "";

          if (compressionMethod === 0) {
            // Stored without compression
            xmlText = new TextDecoder().decode(compressedData);
          } else if (compressionMethod === 8) {
            // Deflate compression
            if (typeof DecompressionStream !== "undefined") {
              const ds = new DecompressionStream("deflate-raw");
              const writer = ds.writable.getWriter();
              writer.write(compressedData);
              writer.close();
              const response = new Response(ds.readable);
              xmlText = await response.text();
            }
          }

          if (xmlText) {
            return parseWordXmlToText(xmlText);
          }
        }

        offset = dataOffset + Math.max(1, compressedSize);
      } else {
        offset++;
      }
    }

    return "";
  } catch (err) {
    console.warn("Realtime client-side OpenXML docx parsing warning:", err);
    return "";
  }
}
