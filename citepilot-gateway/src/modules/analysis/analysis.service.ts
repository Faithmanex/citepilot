import fs from "fs/promises";
import { db } from "../../db/index.js";
import { documents, citations, references, citationResults, referenceResults, styleWarnings } from "../../db/schema.js";
import { config } from "../../config.js";
import { AppError } from "../../middleware/error-handler.js";
import { eq } from "drizzle-orm";

interface AnalyseRequest {
  text: string;
  citation_style: string;
}

interface AnalyseResponse {
  citations: any[];
  references: any[];
  style_warnings: any[];
}

async function callAiService(body: AnalyseRequest): Promise<AnalyseResponse> {
  const url = `${config.ai.serviceUrl}/api/v1/analyse`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new AppError(502, "AI_SERVICE_ERROR", `AI service returned ${response.status}: ${err}`);
  }
  return response.json() as Promise<AnalyseResponse>;
}

export async function triggerAnalysis(userId: string, documentId: string) {
  const [doc] = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
  if (!doc || doc.userId !== userId) {
    throw new AppError(404, "NOT_FOUND", "Document not found");
  }
  if (doc.status !== "uploaded" && doc.status !== "parsed") {
    throw new AppError(409, "INVALID_STATUS", `Document is in ${doc.status} state; cannot re-analyse`);
  }

  await db.update(documents).set({ status: "analysing", progress: 10 }).where(eq(documents.id, documentId));

  try {
    let text: string;
    if (doc.filePath) {
      text = await fs.readFile(doc.filePath, "utf-8");
    } else {
      throw new AppError(400, "NO_CONTENT", "Document has no content to analyse");
    }

    const result = await callAiService({
      text,
      citation_style: doc.citationStyle,
    });

    for (const c of result.citations) {
      const insertedRows = await db.insert(citations).values({
        documentId,
        rawText: c.raw_text,
        normalisedText: c.raw_text.toLowerCase().replace(/\s+/g, " "),
        extractedAuthors: c.extracted_authors,
        extractedYear: c.extracted_year,
        paragraphIndex: c.paragraph_index,
        charStart: c.char_start,
        charEnd: c.char_end,
        context: c.context,
        citationType: c.citation_type,
        status: c.status,
        confidence: c.confidence,
      }).returning();
      const inserted = insertedRows[0]!;

      if (c.match_type) {
        await db.insert(citationResults).values({
          citationId: inserted.id,
          documentId,
          matchType: c.match_type,
          matchScore: c.confidence ?? 0,
          issues: c.issues ?? [],
          modelUsed: "gemini-2.0-flash",
          processingTimeMs: 0,
        });
      }
    }

    for (const r of result.references) {
      const [inserted] = await db.insert(references).values({
        documentId,
        position: r.position,
        rawEntry: r.raw_entry,
        parsedAuthors: r.parsed_authors,
        parsedYear: r.parsed_year,
        parsedTitle: r.parsed_title,
        parsedJournal: r.parsed_journal,
        parsedVolume: r.parsed_volume,
        parsedIssue: r.parsed_issue,
        parsedPages: r.parsed_pages,
        parsedDoi: r.parsed_doi,
        parsedUrl: r.parsed_url,
        referenceType: r.reference_type,
        status: r.status,
      }).returning();
    }

    for (const w of result.style_warnings) {
      await db.insert(styleWarnings).values({
        documentId,
        code: w.code,
        category: w.category,
        message: w.message,
        suggestion: w.suggestion ?? null,
        severity: w.severity,
        location: { paragraphIndex: w.paragraph_index, charStart: w.char_start, charEnd: w.char_end },
        ruleSource: w.rule_source ?? "ai_powered",
        styleGuideRef: w.style_guide_ref ?? null,
      });
    }

    await db.update(documents).set({
      status: "analysed",
      progress: 100,
      bodyText: text.slice(0, 100000),
      wordCount: text.split(/\s+/).length,
    }).where(eq(documents.id, documentId));

  } catch (err) {
    await db.update(documents).set({
      status: "failed",
      errorMessage: err instanceof Error ? err.message : "Analysis failed",
    }).where(eq(documents.id, documentId));
    throw err;
  }
}
