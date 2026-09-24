import { Request, Response, NextFunction } from "express";
import {
  evaluatePromptAmbiguity,
  generateProductBlueprint,
} from "../services/ai.service.js";

import { streamCodeGeneration } from "../services/codegen.service.js";
import * as projectService from "../services/project.service.js";
import { ProductBlueprint } from "../types/ai.js";
import type { ScaffoldFile } from "../templates/scaffold.js";

const MAX_EDIT_FILES = 400;
const MAX_EDIT_CHARS = 400_000;

function parseEditFiles(value: unknown): ScaffoldFile[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  if (value.length > MAX_EDIT_FILES) return null;

  const files: ScaffoldFile[] = [];
  let total = 0;

  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) return null;
    const { path, content } = entry as { path?: unknown; content?: unknown };
    if (typeof path !== "string" || typeof content !== "string") return null;
    if (path.length === 0 || path.length > 400) return null;

    total += content.length;
    if (total > MAX_EDIT_CHARS) return null;

    files.push({ path, content });
  }

  return files;
}

export async function clarifyPromptHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      res
        .status(400)
        .json({ error: "Prompt is required and must be a non-empty string." });
      return;
    }

    const result = await evaluatePromptAmbiguity(prompt);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function generateBlueprintHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { prompt, clarifications } = req.body;

    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({ error: "Prompt is required." });
      return;
    }

    const blueprint = await generateProductBlueprint(
      prompt,
      clarifications || {},
    );
    res.status(200).json({ success: true, data: blueprint });
  } catch (error) {
    next(error);
  }
}

export async function generateCodeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { projectId, prompt, blueprint, mode, files } = req.body;

    if (!projectId || typeof projectId !== "string") {
      res.status(400).json({ error: "projectId is required" });
      return;
    }

    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({ error: "prompt is required" });
      return;
    }

    const project = await projectService.getProjectById(projectId);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const editing = mode === "edit";
    let editFiles: ScaffoldFile[] | undefined;

    if (editing) {
      const parsed = parseEditFiles(files);
      if (!parsed) {
        res.status(400).json({
          error: "Invalid files payload for edit mode.",
          message: `mode "edit" requires 1-${MAX_EDIT_FILES} files totalling under ${MAX_EDIT_CHARS} characters.`,
        });
        return;
      }
      editFiles = parsed;
    }

    await streamCodeGeneration({
      projectId,
      prompt,
      blueprint: (blueprint || project.blueprint) as
        | ProductBlueprint
        | undefined,
      mode: editing ? "edit" : "create",
      ...(editFiles ? { files: editFiles } : {}),
      res,
    });
  } catch (error) {
    next(error);
  }
}
