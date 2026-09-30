import { Request, Response, NextFunction } from "express";
import { groqConfigured } from "../config/groq.js";

export function requireAiProvider(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!groqConfigured()) {
    res.status(503).json({
      error: "AI is not configured on this server.",
      message:
        "This deployment has no GROQ_API_KEY set. Add it to the server environment and redeploy.",
    });
    return;
  }

  next();
}

export function translateAiError(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  const status = (err as { status?: unknown }).status;

  if (typeof status !== "number") {
    next(err);
    return;
  }

  console.error("AI provider error:", err);

  if (status === 401 || status === 403) {
    res.status(503).json({
      error: "The AI provider rejected this server's credentials.",
      message: "The configured GROQ_API_KEY is not valid.",
    });
    return;
  }

  if (status === 429) {
    res.status(429).json({
      error: "The AI provider is rate limiting this server.",
      message: "Too many AI requests right now. Wait a moment and try again.",
    });
    return;
  }

  res.status(502).json({
    error: "The AI provider request failed.",
    message: "The AI provider could not complete this request. Try again.",
  });
}
