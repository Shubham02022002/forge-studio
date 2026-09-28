import dotenv from "dotenv";

dotenv.config();

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export const NODE_ENV = process.env.NODE_ENV ?? "development";
export const IS_PRODUCTION = NODE_ENV === "production";

export const WEB_APP_URL = stripTrailingSlash(
  process.env.WEB_APP_URL ?? "http://localhost:3000",
);

const configuredOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => stripTrailingSlash(origin.trim()))
  .filter(Boolean);

export const ALLOWED_ORIGINS =
  configuredOrigins.length > 0 ? configuredOrigins : [WEB_APP_URL];

function parseTrustProxy(value: string | undefined): boolean | number {
  const fallback = IS_PRODUCTION ? 1 : false;
  if (value === undefined) return fallback;

  const trimmed = value.trim();
  if (trimmed === "") return fallback;
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;

  const hops = Number(trimmed);
  if (Number.isInteger(hops) && hops >= 0) return hops;

  return fallback;
}

export const TRUST_PROXY = parseTrustProxy(process.env.TRUST_PROXY);
