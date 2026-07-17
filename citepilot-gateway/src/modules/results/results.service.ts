import { db } from "../../db/index.js";
import { citations, references, citationResults, referenceResults, styleWarnings } from "../../db/schema.js";
import { eq, and, sql, lt } from "drizzle-orm";

export async function getCitations(documentId: string, opts: { cursor?: string; limit: number; status?: string; severity?: string }) {
  const limit = Math.min(opts.limit, 200);
  const conditions = [eq(citations.documentId, documentId)];

  if (opts.status) {
    conditions.push(eq(citations.status, opts.status as any));
  }

  if (opts.cursor) {
    const cursorDate = new Date(Buffer.from(opts.cursor, "base64url").toString("utf-8"));
    conditions.push(lt(citations.createdAt, cursorDate));
  }

  const items = await db.select().from(citations)
    .where(and(...conditions))
    .orderBy(sql`${citations.paragraphIndex} ASC, ${citations.charStart} ASC`)
    .limit(limit + 1);

  const hasMore = items.length > limit;
  const results = hasMore ? items.slice(0, limit) : items;

  const enriched = await Promise.all(results.map(async (c) => {
    const [cr] = await db.select().from(citationResults)
      .where(eq(citationResults.citationId, c.id)).limit(1);
    const matchedRef = c.matchedReferenceId
      ? await db.select().from(references).where(eq(references.id, c.matchedReferenceId)).limit(1).then(r => r[0] ?? null)
      : null;

    return {
      id: c.id,
      inTextCitation: c.rawText,
      rawText: c.rawText,
      position: { paragraphIndex: c.paragraphIndex, charStart: c.charStart, charEnd: c.charEnd, context: c.context },
      extractedAuthors: c.extractedAuthors,
      extractedYear: c.extractedYear,
      status: c.status,
      confidence: c.confidence,
      matchedReference: matchedRef ? {
        id: matchedRef.id,
        formattedEntry: matchedRef.rawEntry,
        matchType: cr?.matchType ?? "none",
      } : null,
      issues: cr?.issues ?? [],
      ignored: c.ignored,
      createdAt: c.createdAt,
    };
  }));

  const lastItem = enriched[enriched.length - 1];
  const nextCursor = lastItem
    ? Buffer.from(lastItem.createdAt!.toISOString()).toString("base64url")
    : null;

  return { citations: enriched, pagination: { cursor: nextCursor, limit, hasMore } };
}

export async function getReferences(documentId: string, opts: { cursor?: string; limit: number; status?: string }) {
  const limit = Math.min(opts.limit, 200);
  const conditions = [eq(references.documentId, documentId)];

  if (opts.status) {
    conditions.push(eq(references.status, opts.status as any));
  }

  if (opts.cursor) {
    const cursorDate = new Date(Buffer.from(opts.cursor, "base64url").toString("utf-8"));
    conditions.push(lt(references.createdAt, cursorDate));
  }

  const items = await db.select().from(references)
    .where(and(...conditions))
    .orderBy(references.listIndex, references.position)
    .limit(limit + 1);

  const hasMore = items.length > limit;
  const results = hasMore ? items.slice(0, limit) : items;

  const enriched = await Promise.all(results.map(async (r) => {
    const [rr] = await db.select().from(referenceResults)
      .where(eq(referenceResults.referenceId, r.id)).limit(1);
    return {
      id: r.id,
      position: r.position,
      rawEntry: r.rawEntry,
      parsedMetadata: {
        authors: r.parsedAuthors,
        year: r.parsedYear,
        title: r.parsedTitle,
        journal: r.parsedJournal,
        volume: r.parsedVolume,
        issue: r.parsedIssue,
        pages: r.parsedPages,
        doi: r.parsedDoi,
        type: r.referenceType,
      },
      status: r.status,
      citationCount: r.citationCount,
      issues: rr?.issues ?? [],
    };
  }));

  const lastItem = enriched[enriched.length - 1];
  const nextCursor = lastItem
    ? Buffer.from(String(lastItem.position)).toString("base64url")
    : null;

  return { references: enriched, pagination: { cursor: nextCursor, limit, hasMore } };
}

export async function getStyleWarnings(documentId: string) {
  const items = await db.select().from(styleWarnings)
    .where(eq(styleWarnings.documentId, documentId))
    .orderBy(styleWarnings.severity, styleWarnings.createdAt);
  return items;
}
