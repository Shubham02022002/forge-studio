import { randomBytes, timingSafeEqual } from "node:crypto";
import { Request, Response, NextFunction } from "express";
import {
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_COOKIE_OPTIONS,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
} from "../config/auth.js";
import {
  GITHUB_AUTHORIZE_URL,
  GITHUB_CALLBACK_URL,
  GITHUB_SCOPE,
  WEB_APP_URL,
  githubCredentials,
} from "../config/github.js";
import * as authService from "../services/auth.service.js";
import { completeGithubSignIn } from "../services/github.service.js";
import { createSession, deleteSession } from "../services/session.service.js";
import { readCookie } from "../utils/cookies.js";
import { safeNext } from "../utils/redirect.js";

const OAUTH_STATE_BYTES = 32;

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

interface OAuthFlow {
  state: string;
  next: string | null;
}

function encodeFlow(flow: OAuthFlow): string {
  return Buffer.from(JSON.stringify(flow), "utf8").toString("base64url");
}

function decodeFlow(raw: string | null): OAuthFlow | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    ) as { state?: unknown; next?: unknown };

    if (typeof parsed.state !== "string" || parsed.state.length === 0) {
      return null;
    }

    return { state: parsed.state, next: safeNext(parsed.next) };
  } catch {
    return null;
  }
}

function stateMatches(expected: string, actual: string | null): boolean {
  if (!actual || actual.length !== expected.length) return false;

  return timingSafeEqual(
    Buffer.from(expected, "utf8"),
    Buffer.from(actual, "utf8"),
  );
}

function signinUrl(next: string | null, error?: string): string {
  const params = new URLSearchParams();
  if (error) params.set("error", `github_${error}`);
  if (next) params.set("next", next);

  const query = params.toString();
  return `${WEB_APP_URL}/signin${query ? `?${query}` : ""}`;
}

export function githubStartHandler(req: Request, res: Response): void {
  const credentials = githubCredentials();
  const next = safeNext(req.query.next);

  if (!credentials) {
    res.redirect(signinUrl(next, "unavailable"));
    return;
  }

  const state = randomBytes(OAUTH_STATE_BYTES).toString("base64url");

  res.cookie(
    OAUTH_STATE_COOKIE,
    encodeFlow({ state, next }),
    OAUTH_STATE_COOKIE_OPTIONS,
  );

  const authorize = new URL(GITHUB_AUTHORIZE_URL);
  authorize.searchParams.set("client_id", credentials.clientId);
  authorize.searchParams.set("redirect_uri", GITHUB_CALLBACK_URL);
  authorize.searchParams.set("scope", GITHUB_SCOPE);
  authorize.searchParams.set("state", state);

  res.redirect(authorize.toString());
}

export async function githubCallbackHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const flow = decodeFlow(readCookie(req, OAUTH_STATE_COOKIE));
    const state = typeof req.query.state === "string" ? req.query.state : null;
    const code = typeof req.query.code === "string" ? req.query.code : null;
    const target = flow?.next ?? null;

    res.clearCookie(OAUTH_STATE_COOKIE, OAUTH_STATE_COOKIE_OPTIONS);

    if (req.query.error === "access_denied") {
      res.redirect(signinUrl(target, "denied"));
      return;
    }

    if (!flow || !stateMatches(flow.state, state) || !code) {
      res.redirect(signinUrl(target, "state"));
      return;
    }

    const github = await completeGithubSignIn(code);

    if (!github.ok) {
      res.redirect(
        signinUrl(
          target,
          github.reason === "no-verified-email" ? "email" : "failed",
        ),
      );
      return;
    }

    const result = await authService.signInWithGithub(github.profile);

    if (!result.ok) {
      res.redirect(signinUrl(target, "linked"));
      return;
    }

    await startSession(res, result.user.id);
    res.redirect(`${WEB_APP_URL}${target ?? "/workspace"}`);
  } catch (error) {
    next(error);
  }
}
