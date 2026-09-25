export const MODEL_TPM_LIMIT = 8000;
export const REQUEST_TOKEN_BUDGET = 6000;

const CHARS_PER_TOKEN = 3.5;

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function isTokenLimitError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  const { status, message } = error as { status?: unknown; message?: unknown };
  if (typeof message !== "string") return false;
  if (!/request too large|tokens per minute|\btpm\b/i.test(message)) return false;

  return status === 413 || status === 429 || status === undefined;
}
