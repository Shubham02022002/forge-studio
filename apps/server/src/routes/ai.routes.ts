import { Router } from "express";
import {
  clarifyPromptHandler,
  generateBlueprintHandler,
} from "../controllers/ai.controller.js";

const router = Router();

router.post("/clarify", clarifyPromptHandler);
router.post("/blueprint", generateBlueprintHandler);

export default router;
