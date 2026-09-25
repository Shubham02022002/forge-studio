import { groq } from "../config/groq.js";
import {
  buildEditUserPrompt,
  fileBlock,
} from "../prompts/codegen.prompt.js";
import type { ScaffoldFile } from "../templates/scaffold.js";
import { estimateTokens } from "../utils/tokens.js";

const SELECT_MODEL = "openai/gpt-oss-20b";
const SELECT_MAX_TOKENS = 700;
const MAX_SIGNATURE_CHARS = 200;
const PRIORITY_PATHS = ["src/App.tsx", "src/types.ts"];

export interface EditContext {
  mode: "full" | "selected";
  files: ScaffoldFile[];
  outline: string | null;
  totalFiles: number;
}

export interface EditContextOptions {
  forceSelection?: boolean;
}

const SELECTION_SYSTEM = `You decide which files of an existing React project must be read to carry out a change request.

You are given a CHANGE REQUEST and a manifest of every file in the project. Each manifest line has the form:
path — imports: [module names] | exports: [exported names]

Reply with valid JSON in exactly this shape:
{ "paths": ["src/App.tsx", "src/components/Header.tsx"] }

Rules:
1. Include every file the change would directly edit.
2. Include the files that define the components, hooks, types, or data the change must use or stay consistent with.
3. Exclude everything unrelated. Budget is tight, so be precise rather than generous.
4. Use ONLY paths that appear in the manifest. Never invent a path.
5. Return up to 15 paths, ordered most relevant first. Include every file that plausibly touches the change — a missing file is worse than an extra one.`;

function fileSignature(content: string): string {
  const imports = new Set<string>();
  for (const match of content.matchAll(/from\s+["']([^"']+)["']/g)) {
    imports.add(match[1]);
  }

  const exports = new Set<string>();
  for (const match of content.matchAll(
    /export\s+(?:default\s+)?(?:async\s+)?(?:function|const|let|class|interface|type|enum)\s+([A-Za-z0-9_$]+)/g,
  )) {
    exports.add(match[1]);
  }
  if (/export\s+default\s+(?!function|class)/.test(content)) {
    exports.add("default");
  }

  const parts: string[] = [];
  if (imports.size > 0) parts.push(`imports: ${[...imports].join(", ")}`);
  if (exports.size > 0) parts.push(`exports: ${[...exports].join(", ")}`);

  return parts.join(" | ").slice(0, MAX_SIGNATURE_CHARS);
}

function buildOutline(files: ScaffoldFile[]): string {
  return files
    .map((file) => {
      const signature = fileSignature(file.content);
      return signature ? `- ${file.path} — ${signature}` : `- ${file.path}`;
    })
    .join("\n");
}

async function selectPaths(
  instruction: string,
  files: ScaffoldFile[],
): Promise<string[]> {
  try {
    const completion = await groq.chat.completions.create({
      model: SELECT_MODEL,
      messages: [
        { role: "system", content: SELECTION_SYSTEM },
        {
          role: "user",
          content: `CHANGE REQUEST\n${instruction}\n\nFILE MANIFEST — ${files.length} files\n${buildOutline(files)}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: SELECT_MAX_TOKENS,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content) as { paths?: unknown };
    if (!Array.isArray(parsed.paths)) return [];

    return parsed.paths.filter((path): path is string => typeof path === "string");
  } catch (error) {
    console.error("Edit context selection failed, falling back to budget order:", error);
    return [];
  }
}

export async function buildEditContext(
  instruction: string,
  files: ScaffoldFile[],
  budget: number,
  { forceSelection = false }: EditContextOptions = {},
): Promise<EditContext> {
  if (!forceSelection) {
    const full = buildEditUserPrompt(instruction, files);
    if (estimateTokens(full) <= budget) {
      return { mode: "full", files, outline: null, totalFiles: files.length };
    }
  }

  const known = new Map(files.map((file) => [file.path, file]));
  const selected = await selectPaths(instruction, files);

  const ordered: ScaffoldFile[] = [];
  const seen = new Set<string>();

  const add = (path: string) => {
    const file = known.get(path);
    if (!file || seen.has(path)) return;
    seen.add(path);
    ordered.push(file);
  };

  for (const path of PRIORITY_PATHS) add(path);
  for (const path of selected) add(path);
  for (const file of files) {
    if (instruction.includes(file.path)) add(file.path);
  }
  for (const file of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
    add(file.path);
  }

  const reserve = estimateTokens(
    buildEditUserPrompt(instruction, [], { outline: buildOutline(files) }),
  );

  const chosen: ScaffoldFile[] = [];
  let used = reserve;

  for (const file of ordered) {
    const cost = estimateTokens(fileBlock(file.path, file.content));
    if (used + cost > budget) continue;
    used += cost;
    chosen.push(file);
  }

  if (chosen.length === 0) {
    throw new Error(
      "This app is too large for the current model plan to edit. Try a smaller change.",
    );
  }

  const shown = new Set(chosen.map((file) => file.path));

  return {
    mode: "selected",
    files: chosen,
    outline: buildOutline(files.filter((file) => !shown.has(file.path))),
    totalFiles: files.length,
  };
}
