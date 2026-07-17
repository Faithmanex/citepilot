import { Router } from "express";
import { registerSchema, loginSchema, refreshSchema } from "./auth.schema.js";
import * as authService from "./auth.service.js";
import { authenticate } from "../../middleware/auth.js";
import { AppError } from "../../middleware/error-handler.js";
import { ZodError } from "zod";

const router = Router();

function formatZodError(err: ZodError) {
  return err.errors.map((e) => ({
    code: "VALIDATION_ERROR",
    message: e.message,
    field: e.path.join("."),
  }));
}

router.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const result = await authService.register(body.email, body.password, body.name);
    res.status(201).json({ data: result, meta: { requestId: req.headers["x-request-id"] } });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ data: null, errors: formatZodError(err), meta: { requestId: req.headers["x-request-id"] } });
      return;
    }
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body.email, body.password);
    res.json({ data: result, meta: { requestId: req.headers["x-request-id"] } });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ data: null, errors: formatZodError(err), meta: { requestId: req.headers["x-request-id"] } });
      return;
    }
    next(err);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const body = refreshSchema.parse(req.body);
    const result = await authService.refresh(body.refreshToken);
    res.json({ data: result, meta: { requestId: req.headers["x-request-id"] } });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ data: null, errors: formatZodError(err), meta: { requestId: req.headers["x-request-id"] } });
      return;
    }
    next(err);
  }
});

router.post("/logout", authenticate, async (req, res, next) => {
  try {
    await authService.logout(req.body.refreshToken);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
