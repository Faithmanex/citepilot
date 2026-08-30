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
      paragraphs.push(trimmed);
    }
  }

  return paragraphs.join("\n\n");
}

async function decompressBytes(data: Uint8Array, method: number): Promise<string> {
  if (!data || data.length === 0) return "";

  if (method === 0) {
    // Stored without compression
    return new TextDecoder().decode(data);
  }

  if (method === 8) {
    // Deflate compression
    if (typeof DecompressionStream === "undefined") {
      return "";
    }

    try {
      const ds = new DecompressionStream("deflate-raw");
      const blob = new Blob([data as unknown as BlobPart]);
      const stream = blob.stream().pipeThrough(ds);
      const response = new Response(stream);
      return await response.text();
    } catch {
      // Fallback: Some encoders include zlib header
      try {
        const ds = new DecompressionStream("deflate");
        const blob = new Blob([data as unknown as BlobPart]);
        const stream = blob.stream().pipeThrough(ds);
        const response = new Response(stream);
        return await response.text();
      } catch {
        return "";
      }
    }
  }

  return "";
}

function findCentralDirectory(bytes: Uint8Array): { cdOffset: number; cdEntries: number } | null {
  if (bytes.length < 22) return null;

  // Search backwards from the end for EOCD signature PK\x05\x06 (0x06054b50)
  const maxSearch = Math.min(bytes.length, 65557);
  const minOffset = bytes.length - maxSearch;

  for (let i = bytes.length - 22; i >= minOffset; i--) {
    if (
      bytes[i] === 0x50 &&
      bytes[i + 1] === 0x4b &&
      bytes[i + 2] === 0x05 &&
      bytes[i + 3] === 0x06
    ) {
      const cdEntries = bytes[i + 10] | (bytes[i + 11] << 8);
      const cdOffset =
        (bytes[i + 16] |
          (bytes[i + 17] << 8) |
          (bytes[i + 18] << 16) |
          (bytes[i + 19] << 24)) >>>
        0;

      if (cdOffset < bytes.length) {
        return { cdOffset, cdEntries };
      }
    }
  }

  return null;
}

export async function extractTextFromDocx(file: File | Blob): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    if (bytes.length < 30) return "";

    // 1. Primary Strategy: Central Directory (authoritative sizes even with streaming data descriptors)
    const cdInfo = findCentralDirectory(bytes);
    if (cdInfo) {
      let cdPtr = cdInfo.cdOffset;
      const decoder = new TextDecoder();

      for (let i = 0; i < cdInfo.cdEntries && cdPtr < bytes.length - 46; i++) {
        if (
          bytes[cdPtr] === 0x50 &&
          bytes[cdPtr + 1] === 0x4b &&
          bytes[cdPtr + 2] === 0x01 &&
          bytes[cdPtr + 3] === 0x02
        ) {
          const compressionMethod = bytes[cdPtr + 10] | (bytes[cdPtr + 11] << 8);
          const compressedSize =
            (bytes[cdPtr + 20] |
              (bytes[cdPtr + 21] << 8) |
              (bytes[cdPtr + 22] << 16) |
              (bytes[cdPtr + 23] << 24)) >>>
            0;
          const fileNameLen = bytes[cdPtr + 28] | (bytes[cdPtr + 29] << 8);
          const extraLen = bytes[cdPtr + 30] | (bytes[cdPtr + 31] << 8);
          const commentLen = bytes[cdPtr + 32] | (bytes[cdPtr + 33] << 8);
          const localHeaderOffset =
            (bytes[cdPtr + 42] |
              (bytes[cdPtr + 43] << 8) |
              (bytes[cdPtr + 44] << 16) |
              (bytes[cdPtr + 45] << 24)) >>>
            0;

          const fileNameBytes = bytes.subarray(cdPtr + 46, cdPtr + 46 + fileNameLen);
          const fileName = decoder.decode(fileNameBytes);

          if (fileName === "word/document.xml") {
            // Locate compressed data at local header
            if (
              localHeaderOffset < bytes.length - 30 &&
              bytes[localHeaderOffset] === 0x50 &&
              bytes[localHeaderOffset + 1] === 0x4b &&
              bytes[localHeaderOffset + 2] === 0x03 &&
              bytes[localHeaderOffset + 3] === 0x04
            ) {
              const localNameLen =
                bytes[localHeaderOffset + 26] | (bytes[localHeaderOffset + 27] << 8);
              const localExtraLen =
                bytes[localHeaderOffset + 28] | (bytes[localHeaderOffset + 29] << 8);
              const dataOffset = localHeaderOffset + 30 + localNameLen + localExtraLen;

              if (dataOffset + compressedSize <= bytes.length && compressedSize > 0) {
                const compressedData = bytes.subarray(dataOffset, dataOffset + compressedSize);
                const xmlText = await decompressBytes(compressedData, compressionMethod);
                if (xmlText) {
                  return parseWordXmlToText(xmlText);
                }
              }
            }
          }

          cdPtr += 46 + fileNameLen + extraLen + commentLen;
        } else {
          break;
        }
      }
    }

    // 2. Secondary Fallback: Scan Local File Headers (for non-standard or truncated archives)
    let offset = 0;
    const decoder = new TextDecoder();

    while (offset < bytes.length - 30) {
      if (
        bytes[offset] === 0x50 &&
        bytes[offset + 1] === 0x4b &&
        bytes[offset + 2] === 0x03 &&
        bytes[offset + 3] === 0x04
      ) {
        const flags = bytes[offset + 6] | (bytes[offset + 7] << 8);
        const compressionMethod = bytes[offset + 8] | (bytes[offset + 9] << 8);
        let compressedSize =
          (bytes[offset + 18] |
            (bytes[offset + 19] << 8) |
            (bytes[offset + 20] << 16) |
            (bytes[offset + 21] << 24)) >>>
          0;
        const fileNameLen = bytes[offset + 26] | (bytes[offset + 27] << 8);
        const extraFieldLen = bytes[offset + 28] | (bytes[offset + 29] << 8);

        const fileNameBytes = bytes.subarray(offset + 30, offset + 30 + fileNameLen);
        const fileName = decoder.decode(fileNameBytes);

        const dataOffset = offset + 30 + fileNameLen + extraFieldLen;

        // If data descriptor flag (bit 3) is set and size is 0, attempt to scan for next PK boundary
        if ((flags & 0x08) !== 0 && compressedSize === 0) {
          for (let probe = dataOffset; probe < bytes.length - 4; probe++) {
            if (
              bytes[probe] === 0x50 &&
              bytes[probe + 1] === 0x4b &&
              (bytes[probe + 2] === 0x07 || // Data descriptor PK\x07\x08
               bytes[probe + 2] === 0x03 || // Next local header PK\x03\x04
               bytes[probe + 2] === 0x01)   // Central directory PK\x01\x02
            ) {
              compressedSize = probe - dataOffset;
              break;
            }
          }
        }

        if (fileName === "word/document.xml" && compressedSize > 0 && dataOffset + compressedSize <= bytes.length) {
          const compressedData = bytes.subarray(dataOffset, dataOffset + compressedSize);
          const xmlText = await decompressBytes(compressedData, compressionMethod);

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
    console.warn("Client-side OpenXML extraction note:", err instanceof Error ? err.message : String(err));
    return "";
  }
}
