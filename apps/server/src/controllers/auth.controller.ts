import { Request, Response, NextFunction } from "express";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "../config/auth.js";
import * as authService from "../services/auth.service.js";
import { createSession, deleteSession } from "../services/session.service.js";
import { readCookie } from "../utils/cookies.js";

async function startSession(res: Response, userId: string): Promise<void> {
  const { token } = await createSession(userId);
  res.cookie(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
}

export async function signupHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.signUp(req.body);

    if (!result.ok) {
      res.status(409).json({ error: result.message, message: result.message });
      return;
    }

    await startSession(res, result.user.id);
    res.status(201).json({ success: true, data: result.user });
  } catch (error) {
    next(error);
  }
}

export async function signinHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.signIn(req.body);

    if (!result.ok) {
      res.status(401).json({ error: result.message, message: result.message });
      return;
    }

    await startSession(res, result.user.id);
    res.status(200).json({ success: true, data: result.user });
  } catch (error) {
    next(error);
  }
}

export async function signoutHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = readCookie(req, SESSION_COOKIE);
    if (token) await deleteSession(token);

    res.clearCookie(SESSION_COOKIE, SESSION_COOKIE_OPTIONS);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export function meHandler(req: Request, res: Response): void {
  res.status(200).json({ success: true, data: req.user });
}
