import { Router } from "express";
import {
  clarifyPromptHandler,
  generateBlueprintHandler,
  generateCodeHandler,
} from "../controllers/ai.controller.js";

const router = Router();

router.post("/clarify", clarifyPromptHandler);
router.post("/blueprint", generateBlueprintHandler);
router.post("/generate", generateCodeHandler);

export default router;
