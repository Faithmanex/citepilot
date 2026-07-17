import express, { Router } from "express";
import multer from "multer";
import crypto from "crypto";
import path from "path";
import { config } from "../../config.js";
import { authenticate } from "../../middleware/auth.js";
import { uploadSchema, pasteSchema } from "./documents.schema.js";
import * as documentsService from "./documents.service.js";
import { AppError } from "../../middleware/error-handler.js";
import { ZodError } from "zod";

const storage = multer.diskStorage({
  destination: config.upload.dir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(415, "UNSUPPORTED_FILE_TYPE", `File type ${file.mimetype} not supported. Accepted: PDF, DOCX, TXT`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.upload.maxFileSize },
});

const router = Router();

function getUserId(req: express.Request): string {
  return (req as any).user.userId;
}

function getParam(req: express.Request, name: string): string {
  return (req.params as any)[name] as string;
}

router.post("/upload", authenticate, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError(400, "VALIDATION_ERROR", "No file provided");
    }
    const body = uploadSchema.parse(req.body);
    const doc = await documentsService.createFromUpload(
      getUserId(req),
      req.file,
      body.citationStyle,
      body.multiRefList ?? false,
      body.label,
    );
    res.status(202).json({
      data: { document: doc, statusUrl: `/api/v1/documents/${doc.id}/status` },
      meta: { requestId: req.headers["x-request-id"] },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ data: null, errors: err.errors.map((e) => ({ code: "VALIDATION_ERROR", message: e.message, field: e.path.join(".") })), meta: { requestId: req.headers["x-request-id"] } });
      return;
    }
    next(err);
  }
});

router.post("/paste", authenticate, async (req, res, next) => {
  try {
    const body = pasteSchema.parse(req.body);
    const doc = await documentsService.createFromPaste(
      getUserId(req),
      body.text,
      body.citationStyle,
      body.multiRefList ?? false,
      body.label,
    );
    res.status(202).json({
      data: { document: doc, statusUrl: `/api/v1/documents/${doc.id}/status` },
      meta: { requestId: req.headers["x-request-id"] },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ data: null, errors: err.errors.map((e) => ({ code: "VALIDATION_ERROR", message: e.message, field: e.path.join(".") })), meta: { requestId: req.headers["x-request-id"] } });
      return;
    }
    next(err);
  }
});

router.get("/", authenticate, async (req, res, next) => {
  try {
    const cursor = req.query.cursor as string | undefined;
    const limit = parseInt(req.query.limit as string ?? "25", 10);
    const status = req.query.status as string | undefined;
    const result = await documentsService.listDocuments(getUserId(req), { cursor, limit, status });
    res.json({ data: result, meta: { requestId: req.headers["x-request-id"] } });
  } catch (err) {
    next(err);
  }
});

router.get("/:documentId", authenticate, async (req, res, next) => {
  try {
    const doc = await documentsService.getDocument(getUserId(req), getParam(req, "documentId"));
    res.json({ data: { document: doc }, meta: { requestId: req.headers["x-request-id"] } });
  } catch (err) {
    next(err);
  }
});

router.get("/:documentId/status", authenticate, async (req, res, next) => {
  try {
    const st = await documentsService.getDocumentStatus(getUserId(req), getParam(req, "documentId"));
    res.json({ data: st, meta: { requestId: req.headers["x-request-id"] } });
  } catch (err) {
    next(err);
  }
});

router.delete("/:documentId", authenticate, async (req, res, next) => {
  try {
    await documentsService.deleteDocument(getUserId(req), getParam(req, "documentId"));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
