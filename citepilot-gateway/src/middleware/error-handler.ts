import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public field?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      data: null,
      errors: [{ code: err.code, message: err.message, field: err.field }],
      meta: { requestId: req.headers["x-request-id"] },
    });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    data: null,
    errors: [{ code: "INTERNAL_ERROR", message: "An unexpected error occurred" }],
    meta: { requestId: req.headers["x-request-id"] },
  });
}
