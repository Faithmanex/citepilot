import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { db } from "../../db/index.js";
import { documents, citations, references, citationResults, referenceResults, styleWarnings, usageLogs } from "../../db/schema.js";
import { config } from "../../config.js";
import { AppError } from "../../middleware/error-handler.js";
import { eq, and, isNull, desc, asc, sql, lt } from "drizzle-orm";

export async function createFromUpload(
  userId: string,
  file: Express.Multer.File,
  citationStyle: string,
  multiRefList: boolean,
  label?: string,
) {
  const inserted = await db.insert(documents).values({
    userId,
    filename: file.originalname,
    label: label ?? null,
    mimeType: file.mimetype,
    fileSize: file.size,
    filePath: file.path,
    citationStyle,
    multiRefList,
    status: "uploaded",
  }).returning();
  const doc = inserted[0]!;

  await logUsage(userId, "document.upload", doc.id);

  return doc;
}

export async function createFromPaste(
  userId: string,
  text: string,
  citationStyle: string,
  multiRefList: boolean,
  label?: string,
) {
  const filePath = path.join(config.upload.dir, `paste_${crypto.randomUUID()}.txt`);
  await fs.writeFile(filePath, text, "utf-8");

  const inserted = await db.insert(documents).values({
    userId,
    mimeType: "text/plain",
    fileSize: Buffer.byteLength(text, "utf-8"),
    filePath,
    citationStyle,
    multiRefList,
    label: label ?? null,
    status: "uploaded",
  }).returning();
  const doc = inserted[0]!;

  await logUsage(userId, "document.paste", doc.id);

  return doc;
}

export async function listDocuments(userId: string, opts: { cursor?: string; limit: number; status?: string }) {
  const limit = Math.min(opts.limit, 100);
  const conditions = [eq(documents.userId, userId), isNull(documents.deletedAt)];

  if (opts.status) {
    conditions.push(eq(documents.status, opts.status as any));
  }

  if (opts.cursor) {
    const cursorDate = new Date(Buffer.from(opts.cursor, "base64url").toString("utf-8"));
    conditions.push(lt(documents.createdAt, cursorDate));
  }

  const results = await db.select({
    id: documents.id,
    filename: documents.filename,
    label: documents.label,
    citationStyle: documents.citationStyle,
    status: documents.status,
    wordCount: documents.wordCount,
    progress: documents.progress,
    createdAt: documents.createdAt,
    expiresAt: documents.expiresAt,
  }).from(documents)
    .where(and(...conditions))
    .orderBy(desc(documents.createdAt))
    .limit(limit + 1);

  const hasMore = results.length > limit;
  const items = hasMore ? results.slice(0, limit) : results;
  const lastItem = items[items.length - 1];
  const nextCursor = lastItem
    ? Buffer.from(lastItem.createdAt!.toISOString()).toString("base64url")
    : null;

  return { documents: items, pagination: { cursor: nextCursor, limit, hasMore } };
}

export async function getDocument(userId: string, documentId: string) {
  const [doc] = await db.select().from(documents).where(
    and(eq(documents.id, documentId), eq(documents.userId, userId), isNull(documents.deletedAt)),
  ).limit(1);

  if (!doc) {
    throw new AppError(404, "NOT_FOUND", "Document not found");
  }

  return doc;
}

export async function getDocumentStatus(userId: string, documentId: string) {
  const [doc] = await db.select({
    id: documents.id,
    status: documents.status,
    progress: documents.progress,
    errorMessage: documents.errorMessage,
  }).from(documents).where(
    and(eq(documents.id, documentId), eq(documents.userId, userId)),
  ).limit(1);

  if (!doc) {
    throw new AppError(404, "NOT_FOUND", "Document not found");
  }

  return doc;
}

export async function deleteDocument(userId: string, documentId: string) {
  const [doc] = await db.select().from(documents).where(
    and(eq(documents.id, documentId), eq(documents.userId, userId), isNull(documents.deletedAt)),
  ).limit(1);

  if (!doc) {
    throw new AppError(404, "NOT_FOUND", "Document not found");
  }

  await db.update(documents).set({ deletedAt: new Date() }).where(eq(documents.id, documentId));
  await logUsage(userId, "document.delete", documentId);

  if (doc.filePath) {
    try { await fs.unlink(doc.filePath); } catch { /* file may not exist */ }
  }
}

export async function getResultsSummary(userId: string, documentId: string) {
  const doc = await getDocument(userId, documentId);

  const [stats] = await db.select({
    totalCitations: sql<number>`COUNT(DISTINCT ${citations.id})`,
    totalReferences: sql<number>`COUNT(DISTINCT ${references.id})`,
    matched: sql<number>`COUNT(DISTINCT ${citations.id}) FILTER (WHERE ${citations.status} = 'matched')`,
    possibleMatch: sql<number>`COUNT(DISTINCT ${citations.id}) FILTER (WHERE ${citations.status} = 'possible_match')`,
    noMatch: sql<number>`COUNT(DISTINCT ${citations.id}) FILTER (WHERE ${citations.status} = 'no_match')`,
    styleWarnings: sql<number>`COUNT(DISTINCT ${styleWarnings.id})`,
  }).from(documents)
    .leftJoin(citations, eq(citations.documentId, documents.id))
    .leftJoin(references, eq(references.documentId, documents.id))
    .leftJoin(styleWarnings, eq(styleWarnings.documentId, documents.id))
    .where(eq(documents.id, documentId))
    .groupBy(documents.id)
    .limit(1);

  return {
    documentId: doc.id,
    citationStyle: doc.citationStyle,
    status: doc.status,
    wordCount: doc.wordCount,
    counts: stats ?? { totalCitations: 0, totalReferences: 0, matched: 0, possibleMatch: 0, noMatch: 0, styleWarnings: 0 },
    processingTimeMs: doc.processingTimeMs,
  };
}

export async function getAnnotatedDocument(userId: string, documentId: string) {
  const doc = await getDocument(userId, documentId);

  const allCitations = await db.select({
    id: citations.id,
    rawText: citations.rawText,
    paragraphIndex: citations.paragraphIndex,
    charStart: citations.charStart,
    charEnd: citations.charEnd,
    context: citations.context,
    status: citations.status,
  }).from(citations).where(eq(citations.documentId, documentId)).orderBy(citations.paragraphIndex, citations.charStart);

  const text = doc.bodyText ?? "";
  const lines = text.split("\n");
  const paragraphs = lines.map((text, index) => {
    const annotations = allCitations
      .filter((c) => c.paragraphIndex === index)
      .map((c) => ({
        citationId: c.id,
        charStart: c.charStart,
        charEnd: c.charEnd,
        text: c.rawText,
        status: c.status,
        colour: c.status === "matched" ? "green" : c.status === "possible_match" ? "orange" : c.status === "no_match" ? "red" : "gray",
      }));
    return { index, text, annotations };
  });

  return { documentId: doc.id, paragraphs };
}

function stageText(s: string) {
  const map: Record<string, string> = {
    uploaded: "uploaded", parsing: "parsing", parsed: "parsed",
    analysing: "analysing", analysed: "analysed",
    validating: "validating", validated: "validated", failed: "failed",
  };
  return map[s] ?? s;
}

async function logUsage(userId: string, action: string, documentId?: string) {
  await db.insert(usageLogs).values({ userId, action, documentId });
}
