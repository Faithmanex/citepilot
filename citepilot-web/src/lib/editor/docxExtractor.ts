/**
 * Client-Side Realtime OpenXML (.docx) Text Extractor.
 * Parses Microsoft Word OpenXML packages directly in the browser in realtime using standard Web DecompressionStream.
 * Extracts paragraphs, headings (H1-H3), and runs from word/document.xml with zero external dependencies.
 */

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

    // Extract text runs <w:t>
    const textRegex = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/gi;
    let textMatch: RegExpExecArray | null;
    let paraText = "";

    while ((textMatch = textRegex.exec(pContent)) !== null) {
      paraText += textMatch[1];
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

    async function decompressData(compressedData: Uint8Array, compressionMethod: number): Promise<string> {
      if (compressionMethod === 0) {
        return new TextDecoder().decode(compressedData);
      } else if (compressionMethod === 8) {
        if (typeof DecompressionStream !== "undefined") {
          const ds = new DecompressionStream("deflate-raw");
          const writer = ds.writable.getWriter();
          writer.write(compressedData);
          writer.close();
          const response = new Response(ds.readable);
          return await response.text();
        }
      }
      return "";
    }

    // 1. Primary Strategy: Locate word/document.xml via ZIP Central Directory
    // Handles streaming ZIP files (e.g. MS Word / LibreOffice with data descriptors where local compressedSize = 0)
    let eocdOffset = -1;
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
      if (
        bytes[i] === 0x50 &&
        bytes[i + 1] === 0x4b &&
        bytes[i + 2] === 0x05 &&
        bytes[i + 3] === 0x06
      ) {
        eocdOffset = i;
        break;
      }
    }

    if (eocdOffset !== -1) {
      const cdOffset =
        bytes[eocdOffset + 16] |
        (bytes[eocdOffset + 17] << 8) |
        (bytes[eocdOffset + 18] << 16) |
        (bytes[eocdOffset + 19] << 24);

      let offset = cdOffset;
      while (offset < eocdOffset) {
        if (
          bytes[offset] === 0x50 &&
          bytes[offset + 1] === 0x4b &&
          bytes[offset + 2] === 0x01 &&
          bytes[offset + 3] === 0x02
        ) {
          const compressionMethod = bytes[offset + 10] | (bytes[offset + 11] << 8);
          const compressedSize =
            bytes[offset + 20] |
            (bytes[offset + 21] << 8) |
            (bytes[offset + 22] << 16) |
            (bytes[offset + 23] << 24);
          const fileNameLen = bytes[offset + 28] | (bytes[offset + 29] << 8);
          const extraLen = bytes[offset + 30] | (bytes[offset + 31] << 8);
          const commentLen = bytes[offset + 32] | (bytes[offset + 33] << 8);
          const localOffset =
            bytes[offset + 42] |
            (bytes[offset + 43] << 8) |
            (bytes[offset + 44] << 16) |
            (bytes[offset + 45] << 24);

          const fileNameBytes = bytes.subarray(offset + 46, offset + 46 + fileNameLen);
          const fileName = new TextDecoder().decode(fileNameBytes);

          if (fileName === "word/document.xml") {
            const localFileNameLen =
              bytes[localOffset + 26] | (bytes[localOffset + 27] << 8);
            const localExtraLen =
              bytes[localOffset + 28] | (bytes[localOffset + 29] << 8);
            const dataOffset = localOffset + 30 + localFileNameLen + localExtraLen;

            const compressedData = bytes.subarray(dataOffset, dataOffset + compressedSize);
            const xmlText = await decompressData(compressedData, compressionMethod);
            if (xmlText) {
              return parseWordXmlToText(xmlText);
            }
          }

          offset += 46 + fileNameLen + extraLen + commentLen;
        } else {
          break;
        }
      }
    }

    // 2. Fallback Strategy: Local file header linear scan
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

        if (fileName === "word/document.xml" && compressedSize > 0) {
          const compressedData = bytes.subarray(dataOffset, dataOffset + compressedSize);
          const xmlText = await decompressData(compressedData, compressionMethod);
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
