export function normalizeEscaping(text: string): string {
  if (!text.includes("\\`")) return text;
  return text.replace(/\\([`$])/g, "$1");
}
