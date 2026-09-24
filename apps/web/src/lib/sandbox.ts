import type { FileSystemTree, WebContainer } from "@webcontainer/api";
import type { GeneratedFile } from "@/lib/artifacts";

let instance: WebContainer | null = null;
let booting: Promise<WebContainer> | null = null;

export function isSandboxSupported() {
  if (typeof window === "undefined") return false;
  return window.crossOriginIsolated === true;
}

export async function getWebContainer(): Promise<WebContainer> {
  if (instance) return instance;

  if (!booting) {
    booting = import("@webcontainer/api").then(({ WebContainer }) =>
      WebContainer.boot({ coep: "require-corp" }),
    );
  }

  try {
    instance = await booting;
    return instance;
  } catch (error) {
    booting = null;
    throw error;
  }
}

export function toFileSystemTree(files: GeneratedFile[]): FileSystemTree {
  const tree: FileSystemTree = {};

  for (const file of files) {
    const segments = file.path.split("/").filter(Boolean);
    if (segments.length === 0) continue;

    let cursor = tree;

    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index];
      const isLeaf = index === segments.length - 1;

      if (isLeaf) {
        cursor[segment] = { file: { contents: file.content } };
        continue;
      }

      const existing = cursor[segment];

      if (existing && "directory" in existing) {
        cursor = existing.directory;
        continue;
      }

      const directory: FileSystemTree = {};
      cursor[segment] = { directory };
      cursor = directory;
    }
  }

  return tree;
}

const REQUIRED_SCAFFOLD = [
  "package.json",
  "index.html",
  "src/main.tsx",
  "src/App.tsx",
];

export function findMissingScaffold(files: GeneratedFile[]): string[] {
  const paths = new Set(files.map((file) => file.path));
  return REQUIRED_SCAFFOLD.filter((path) => !paths.has(path));
}
