import { Request, Response, NextFunction } from "express";
import {
  evaluatePromptAmbiguity,
  generateProductBlueprint,
} from "../services/ai.service.js";

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
