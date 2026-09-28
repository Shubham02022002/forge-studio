import type { CookieOptions } from "express";
import { IS_PRODUCTION } from "./runtime.js";

export const SESSION_COOKIE = "forge_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const SESSION_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: IS_PRODUCTION,
  path: "/",
  maxAge: SESSION_TTL_MS,
};

export const OAUTH_STATE_COOKIE = "forge_oauth_state";
export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export const OAUTH_STATE_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: IS_PRODUCTION,
  path: "/api/auth",
  maxAge: OAUTH_STATE_TTL_MS,
};
