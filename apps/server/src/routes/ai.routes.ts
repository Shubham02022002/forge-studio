import { Router } from "express";
import {
  clarifyPromptHandler,
  generateBlueprintHandler,
  generateCodeHandler,
} from "../controllers/ai.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  assistantLimiter,
  generationLimiter,
} from "../middleware/rate-limit.middleware.js";

const router = Router();

router.use(requireAuth);

router.post("/clarify", assistantLimiter, clarifyPromptHandler);
router.post("/blueprint", assistantLimiter, generateBlueprintHandler);
router.post("/generate", generationLimiter, generateCodeHandler);

export default router;
