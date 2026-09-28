import dotenv from "dotenv";

dotenv.config();

export const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
export const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
export const GITHUB_API_URL = "https://api.github.com";
export const GITHUB_SCOPE = "read:user user:email";

export const GITHUB_CALLBACK_URL =
  process.env.GITHUB_CALLBACK_URL ??
  "http://localhost:5000/api/auth/github/callback";

export const WEB_APP_URL = process.env.WEB_APP_URL ?? "http://localhost:3000";

export interface GithubCredentials {
  clientId: string;
  clientSecret: string;
}

export function githubCredentials(): GithubCredentials | null {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  return { clientId, clientSecret };
}
