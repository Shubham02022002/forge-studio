export interface GeneratedFile {
  path: string;
  content: string;
  complete: boolean;
}

export interface ParsedArtifacts {
  files: GeneratedFile[];
  shell: string[];
  artifactTitle: string | null;
  started: boolean;
}

const EMPTY: ParsedArtifacts = {
  files: [],
  shell: [],
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
    .map((line) => (line.trim() === "" ? "" : line.slice(Math.min(min, indentWidth(line)))))
    .join("\n");
}

export function normalizeEscaping(text: string): string {
  if (!text.includes("\\`")) return text;
  return text.replace(/\\([`$])/g, "$1");
}

export function parseArtifacts(text: string): ParsedArtifacts {
  if (!text) return EMPTY;

  const artifactOpen = /<forgeArtifact\b([^>]*)>/.exec(text);
  if (!artifactOpen) {
    return { ...EMPTY, started: false };
  }

  const artifactTitle = /title="([^"]*)"/.exec(artifactOpen[1])?.[1] ?? null;

  const open = /<forgeAction\b([^>]*)>/g;
  const openings: Array<{ end: number; attrs: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = open.exec(text)) !== null) {
    openings.push({ end: match.index + match[0].length, attrs: match[1] });
  }

  const files = new Map<string, GeneratedFile>();
  const shell: string[] = [];
  const CLOSE = "</forgeAction>";

  for (const opening of openings) {
    const closeAt = text.indexOf(CLOSE, opening.end);
    const complete = closeAt !== -1;
    const raw = complete
      ? text.slice(opening.end, closeAt)
      : text.slice(opening.end);
    const body = normalizeEscaping(dedent(raw));
    const type = /type="([^"]*)"/.exec(opening.attrs)?.[1] ?? "file";

    if (type === "file") {
      const path = /filePath="([^"]*)"/.exec(opening.attrs)?.[1];
      if (path) files.set(path, { path, content: body, complete });
    } else if (type === "shell" && body.trim()) {
      shell.push(body.trim());
    }
  }

  return { files: [...files.values()], shell, artifactTitle, started: true };
}

export function mergeFiles(
  base: GeneratedFile[],
  incoming: GeneratedFile[],
): GeneratedFile[] {
  if (incoming.length === 0) return base;

  const merged = new Map(base.map((file) => [file.path, file]));
  for (const file of incoming) merged.set(file.path, file);

  return [...merged.values()];
}

export interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[];
}

export function buildTree(files: GeneratedFile[]): TreeNode[] {
  const root: TreeNode = { name: "", path: "", children: [] };

  for (const file of files) {
    const segments = file.path.split("/").filter(Boolean);
    let cursor = root;

    segments.forEach((segment, index) => {
      const isLeaf = index === segments.length - 1;
      const path = segments.slice(0, index + 1).join("/");
      let next = cursor.children.find((child) => child.name === segment);

      if (!next) {
        next = { name: segment, path, children: [] };
        cursor.children.push(next);
      }

      if (!isLeaf) cursor = next;
    });
  }

  const sort = (nodes: TreeNode[]): TreeNode[] => {
    nodes.sort((a, b) => {
      const aDir = a.children.length > 0;
      const bDir = b.children.length > 0;
      if (aDir !== bDir) return aDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((node) => sort(node.children));
    return nodes;
  };

  return sort(root.children);
}

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  json: "json",
  css: "css",
  html: "html",
  md: "markdown",
  prisma: "prisma",
  sql: "sql",
  yml: "yaml",
  yaml: "yaml",
};

export function languageFor(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return LANGUAGE_BY_EXTENSION[ext] ?? "text";
}
