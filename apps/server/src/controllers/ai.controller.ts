import { Request, Response, NextFunction } from "express";
import {
  evaluatePromptAmbiguity,
  generateProductBlueprint,
} from "../services/ai.service.js";

import { streamCodeGeneration } from "../services/codegen.service.js";
import * as projectService from "../services/project.service.js";
import { ProductBlueprint } from "../types/ai.js";

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
    const { projectId, prompt, blueprint } = req.body;

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
    
    await streamCodeGeneration({
      projectId,
      prompt,
      blueprint: (blueprint || project.blueprint) as
        | ProductBlueprint
        | undefined,
      res,
    });
  } catch (error) {
    next(error);
  }
}
