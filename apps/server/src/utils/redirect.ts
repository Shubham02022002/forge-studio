const MAX_NEXT_CHARS = 512;

export function safeNext(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (value.length === 0 || value.length > MAX_NEXT_CHARS) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;
  if (value.includes("\\") || value.includes("\0")) return null;
  if (/[\n\r]/.test(value)) return null;

  return value;
}
