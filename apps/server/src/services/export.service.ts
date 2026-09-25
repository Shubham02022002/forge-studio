import { getProjectById } from "./project.service.js";
import {
  mergeFiles,
  parseArtifacts,
  type ArtifactFile,
} from "../utils/artifacts.js";
import { createZip, type ZipEntry } from "../utils/zip.js";

const MAX_FILES = 500;
const MAX_FILE_BYTES = 512 * 1024;
const MAX_TOTAL_BYTES = 8 * 1024 * 1024;
const MAX_PATH_CHARS = 300;

export type ExportResult =
  | {
      ok: true;
      filename: string;
      fileCount: number;
      skipped: number;
      zip: Buffer;
    }
  | { ok: false; reason: "not-found" | "empty" | "too-large"; message: string };

export function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "forge-app";
}

function isSafePath(path: string): boolean {
  if (!path || path.length > MAX_PATH_CHARS) return false;
  if (path.includes("\\") || path.includes("\0") || path.includes(":")) return false;

  const segments = path.split("/");
  return segments.every(
    (segment) => segment !== "" && segment !== "." && segment !== "..",
  );
}

function readmeFile(title: string, description: string | null): ArtifactFile {
  const lines = [
    `# ${title}`,
    "",
    description ?? "Generated with Forge Studio.",
    "",
    "## Stack",
    "",
    "- React 19 with TypeScript",
    "- Vite",
    "- Tailwind CSS v4",
    "- react-router-dom (HashRouter)",
    "",
    "## Run it",
    "",
    "```bash",
    "npm install",
    "npm run dev",
    "```",
    "",
    "Vite prints the local URL, usually http://localhost:5173.",
    "",
    "## Build it",
    "",
    "```bash",
    "npm run build",
    "npm run preview",
    "```",
    "",
  ];

  return { path: "README.md", content: lines.join("\n"), complete: true };
}

function gitignoreFile(): ArtifactFile {
  const lines = ["node_modules", "dist", "*.local", ".DS_Store", ""];
  return { path: ".gitignore", content: lines.join("\n"), complete: true };
}

export async function exportProject(projectId: string): Promise<ExportResult> {
  const project = await getProjectById(projectId);
  if (!project) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }

  let merged: ArtifactFile[] = [];
  for (const message of project.messages) {
    if (message.type !== "code") continue;
    merged = mergeFiles(merged, parseArtifacts(message.content).files);
  }

  const usable = merged.filter((file) => file.complete);
  const skipped = merged.length - usable.length;

  const files = usable
    .filter((file) => isSafePath(file.path))
    .filter((file) => Buffer.byteLength(file.content, "utf8") <= MAX_FILE_BYTES)
    .slice(0, MAX_FILES);

  if (files.length === 0) {
    return {
      ok: false,
      reason: "empty",
      message: "This project has no generated files to export yet.",
    };
  }

  const present = new Set(files.map((file) => file.path));
  const extras: ArtifactFile[] = [];
  if (!present.has("README.md")) extras.push(readmeFile(project.title, project.description));
  if (!present.has(".gitignore")) extras.push(gitignoreFile());

  const entries: ZipEntry[] = [...extras, ...files].map((file) => ({
    path: file.path,
    content: file.content,
  }));

  const total = entries.reduce(
    (sum, entry) => sum + Buffer.byteLength(entry.content, "utf8"),
    0,
  );

  if (total > MAX_TOTAL_BYTES) {
    return {
      ok: false,
      reason: "too-large",
      message: "This project is too large to export.",
    };
  }

  return {
    ok: true,
    filename: `${slugify(project.title)}.zip`,
    fileCount: entries.length,
    skipped,
    zip: createZip(entries),
  };
}
