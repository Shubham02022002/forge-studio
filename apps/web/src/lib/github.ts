export function githubSignInHref(next: string | null): string {
  const params = new URLSearchParams();
  if (next) params.set("next", next);

  const query = params.toString();

  return `/api/auth/github${query ? `?${query}` : ""}`;
}

const NOTICES: Record<string, string> = {
  github_denied: "GitHub sign in was cancelled.",
  github_state: "That sign in attempt expired. Please try again.",
  github_email:
    "Your GitHub account needs a verified primary email address before it can be used here.",
  github_linked:
    "An account with that email already exists. Sign in with your password instead.",
  github_failed: "GitHub sign in failed. Please try again.",
  github_unavailable: "GitHub sign in is not configured on this server.",
};

export function githubNotice(code: string | null): string | null {
  if (!code) return null;

  return NOTICES[code] ?? null;
}
