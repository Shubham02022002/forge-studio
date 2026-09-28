import {
  GITHUB_API_URL,
  GITHUB_CALLBACK_URL,
  GITHUB_TOKEN_URL,
  githubCredentials,
} from "../config/github.js";

export interface GithubProfile {
  githubId: string;
  username: string;
  avatarUrl: string | null;
  name: string | null;
  email: string;
  accessToken: string;
}

export type GithubResult =
  | { ok: true; profile: GithubProfile }
  | {
      ok: false;
      reason: "not-configured" | "exchange-failed" | "no-verified-email";
      message: string;
    };

const GITHUB_TIMEOUT_MS = 10_000;

function githubFetch(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "forge-studio",
      ...init.headers,
    },
  });
}

async function exchangeCode(code: string): Promise<string | null> {
  const credentials = githubCredentials();
  if (!credentials) return null;

  const res = await githubFetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      code,
      redirect_uri: GITHUB_CALLBACK_URL,
    }),
  });

  if (!res.ok) return null;

  const body = (await res.json().catch(() => null)) as {
    access_token?: unknown;
  } | null;

  return typeof body?.access_token === "string" && body.access_token.length > 0
    ? body.access_token
    : null;
}

function pickVerifiedPrimaryEmail(payload: unknown): string | null {
  if (!Array.isArray(payload)) return null;

  for (const entry of payload) {
    if (typeof entry !== "object" || entry === null) continue;

    const { email, primary, verified } = entry as {
      email?: unknown;
      primary?: unknown;
      verified?: unknown;
    };

    if (
      primary === true &&
      verified === true &&
      typeof email === "string" &&
      email.length > 0
    ) {
      return email.trim().toLowerCase();
    }
  }

  return null;
}

async function fetchProfile(accessToken: string): Promise<GithubProfile | null> {
  const headers = { Authorization: `Bearer ${accessToken}` };

  const [userRes, emailRes] = await Promise.all([
    githubFetch(`${GITHUB_API_URL}/user`, { headers }),
    githubFetch(`${GITHUB_API_URL}/user/emails`, { headers }),
  ]);

  if (!userRes.ok) return null;

  const user = (await userRes.json().catch(() => null)) as {
    id?: unknown;
    login?: unknown;
    name?: unknown;
    avatar_url?: unknown;
  } | null;

  if (!user) return null;
  if (typeof user.id !== "number" && typeof user.id !== "string") return null;
  if (typeof user.login !== "string" || user.login.length === 0) return null;

  const email = pickVerifiedPrimaryEmail(
    emailRes.ok ? await emailRes.json().catch(() => null) : null,
  );

  if (!email) return null;

  return {
    githubId: String(user.id),
    username: user.login,
    avatarUrl: typeof user.avatar_url === "string" ? user.avatar_url : null,
    name: typeof user.name === "string" ? user.name : null,
    email,
    accessToken,
  };
}

export async function completeGithubSignIn(
  code: string,
): Promise<GithubResult> {
  if (!githubCredentials()) {
    return {
      ok: false,
      reason: "not-configured",
      message: "GitHub sign in is not configured on this server.",
    };
  }

  const accessToken = await exchangeCode(code);

  if (!accessToken) {
    return {
      ok: false,
      reason: "exchange-failed",
      message: "GitHub did not accept that authorization code.",
    };
  }

  const profile = await fetchProfile(accessToken);

  if (!profile) {
    return {
      ok: false,
      reason: "no-verified-email",
      message: "Your GitHub account has no verified primary email address.",
    };
  }

  return { ok: true, profile };
}
