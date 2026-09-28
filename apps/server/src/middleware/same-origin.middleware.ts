import type { NextFunction, Request, Response } from "express";
import { ALLOWED_ORIGINS } from "../config/runtime.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function requireSameOrigin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const origin = req.headers.origin;

  if (origin === undefined || ALLOWED_ORIGINS.includes(origin)) {
    next();
    return;
  }

  res.status(403).json({
    error: "Forbidden",
    message: "This request did not come from an allowed origin.",
  });
}
