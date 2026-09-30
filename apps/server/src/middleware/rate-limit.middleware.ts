import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import type { Request } from "express";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

const baseOptions = {
  standardHeaders: "draft-8",
  legacyHeaders: false,
} as const;

function perUser(req: Request): string {
  return req.user ? `user:${req.user.id}` : ipKeyGenerator(req.ip ?? "unknown");
}

export const credentialLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * MINUTE_MS,
  limit: 30,
  message: { error: "Too many attempts. Please try again later." },
});

export const generationLimiter = rateLimit({
  ...baseOptions,
  windowMs: HOUR_MS,
  limit: 20,
  keyGenerator: perUser,
  message: {
    error:
      "You have reached the hourly limit for code generation. Try again later.",
  },
});

export const assistantLimiter = rateLimit({
  ...baseOptions,
  windowMs: HOUR_MS,
  limit: 60,
  keyGenerator: perUser,
  message: {
    error:
      "You have reached the hourly limit for assistant requests. Try again later.",
  },
});

export const voiceLimiter = rateLimit({
  ...baseOptions,
  windowMs: HOUR_MS,
  limit: 30,
  keyGenerator: perUser,
  message: {
    error:
      "You have reached the hourly limit for voice transcription. Try again later.",
  },
});

export const exportLimiter = rateLimit({
  ...baseOptions,
  windowMs: HOUR_MS,
  limit: 60,
  keyGenerator: perUser,
  message: {
    error:
      "You have reached the hourly limit for project downloads. Try again later.",
  },
});
