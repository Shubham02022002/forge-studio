import { Request, Response, NextFunction } from "express";
import { SESSION_COOKIE } from "../config/auth.js";
import { getSessionUser } from "../services/session.service.js";
import { readCookie } from "../utils/cookies.js";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = readCookie(req, SESSION_COOKIE);
    const user = token ? await getSessionUser(token) : null;

    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireUserId(req: Request): string {
  if (!req.user) {
    throw new Error("Route is missing requireAuth");
  }

  return req.user.id;
}
