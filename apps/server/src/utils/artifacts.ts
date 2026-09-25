import { normalizeEscaping } from "./normalize.js";

export interface ArtifactFile {
  path: string;
  content: string;
  complete: boolean;
}

export interface ParsedArtifacts {
  files: ArtifactFile[];
  artifactTitle: string | null;
  started: boolean;
}

const EMPTY: ParsedArtifacts = {
  files: [],
  artifactTitle: null,
  started: false,
};

function indentWidth(line: string) {
  return line.match(/^[ \t]*/)?.[0].length ?? 0;
}

export function dedent(raw: string): string {
  const text = raw.replace(/^\r?\n/, "").replace(/[ \t]+$/, "");
  const lines = text.split("\n");

  let min = Number.POSITIVE_INFINITY;
  for (const line of lines) {
    if (line.trim() === "") continue;
    min = Math.min(min, indentWidth(line));
  }

  if (!Number.isFinite(min) || min === 0) return text;

  return lines
    .map((line) =>
      line.trim() === "" ? "" : line.slice(Math.min(min, indentWidth(line))),
    )
    .join("\n");
}

export function parseArtifacts(text: string): ParsedArtifacts {
  if (!text) return EMPTY;

  const artifactOpen = /<forgeArtifact\b([^>]*)>/.exec(text);
  if (!artifactOpen) return { ...EMPTY };

  const artifactTitle = /title="([^"]*)"/.exec(artifactOpen[1])?.[1] ?? null;

  const open = /<forgeAction\b([^>]*)>/g;
  const openings: Array<{ end: number; attrs: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = open.exec(text)) !== null) {
    openings.push({ end: match.index + match[0].length, attrs: match[1] });
  }

  const files = new Map<string, ArtifactFile>();
  const CLOSE = "</forgeAction>";

  for (const opening of openings) {
    const type = /type="([^"]*)"/.exec(opening.attrs)?.[1] ?? "file";
    if (type !== "file") continue;

    const path = /filePath="([^"]*)"/.exec(opening.attrs)?.[1];
    if (!path) continue;

    const closeAt = text.indexOf(CLOSE, opening.end);
    const complete = closeAt !== -1;
    const raw = complete ? text.slice(opening.end, closeAt) : text.slice(opening.end);

    files.set(path, {
      path,
      content: normalizeEscaping(dedent(raw)),
      complete,
    });
  }

  return { files: [...files.values()], artifactTitle, started: true };
}

export function mergeFiles(
  base: ArtifactFile[],
  incoming: ArtifactFile[],
): ArtifactFile[] {
  if (incoming.length === 0) return base;

  const merged = new Map(base.map((file) => [file.path, file]));
  for (const file of incoming) merged.set(file.path, file);

  return [...merged.values()];
}
