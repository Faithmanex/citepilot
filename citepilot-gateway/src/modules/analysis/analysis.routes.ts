import express, { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import * as analysisService from "./analysis.service.js";

function getUserId(req: express.Request): string {
  return (req as any).user.userId;
}

function getParam(req: express.Request, name: string): string {
  return (req.params as any)[name] as string;
}

const router = Router();

router.post("/:documentId/analyse", authenticate, async (req, res, next) => {
  try {
    await analysisService.triggerAnalysis(getUserId(req), getParam(req, "documentId"));
    res.json({
      data: { documentId: getParam(req, "documentId"), status: "analysing" },
      meta: { requestId: req.headers["x-request-id"] },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
