import express, { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import * as documentsService from "../documents/documents.service.js";
import * as resultsService from "./results.service.js";

function getUserId(req: express.Request): string {
  return (req as any).user.userId;
}

function getParam(req: express.Request, name: string): string {
  return (req.params as any)[name] as string;
}

const router = Router();

router.get("/:documentId/results/citations", authenticate, async (req, res, next) => {
  try {
    const docId = getParam(req, "documentId");
    await documentsService.getDocument(getUserId(req), docId);
    const cursor = req.query.cursor as string | undefined;
    const limit = parseInt(req.query.limit as string ?? "50", 10);
    const status = req.query.status as string | undefined;
    const result = await resultsService.getCitations(docId, { cursor, limit, status });
    res.json({ data: result, meta: { requestId: req.headers["x-request-id"] } });
  } catch (err) {
    next(err);
  }
});

router.get("/:documentId/results/references", authenticate, async (req, res, next) => {
  try {
    const docId = getParam(req, "documentId");
    await documentsService.getDocument(getUserId(req), docId);
    const cursor = req.query.cursor as string | undefined;
    const limit = parseInt(req.query.limit as string ?? "50", 10);
    const status = req.query.status as string | undefined;
    const result = await resultsService.getReferences(docId, { cursor, limit, status });
    res.json({ data: result, meta: { requestId: req.headers["x-request-id"] } });
  } catch (err) {
    next(err);
  }
});

router.get("/:documentId/results/summary", authenticate, async (req, res, next) => {
  try {
    const result = await documentsService.getResultsSummary(getUserId(req), getParam(req, "documentId"));
    res.json({ data: { summary: result }, meta: { requestId: req.headers["x-request-id"] } });
  } catch (err) {
    next(err);
  }
});

router.get("/:documentId/results/annotated", authenticate, async (req, res, next) => {
  try {
    const result = await documentsService.getAnnotatedDocument(getUserId(req), getParam(req, "documentId"));
    res.json({ data: { annotatedDocument: result }, meta: { requestId: req.headers["x-request-id"] } });
  } catch (err) {
    next(err);
  }
});

router.get("/:documentId/results/style-warnings", authenticate, async (req, res, next) => {
  try {
    const docId = getParam(req, "documentId");
    await documentsService.getDocument(getUserId(req), docId);
    const warnings = await resultsService.getStyleWarnings(docId);
    res.json({ data: { styleWarnings: warnings }, meta: { requestId: req.headers["x-request-id"] } });
  } catch (err) {
    next(err);
  }
});

export default router;
