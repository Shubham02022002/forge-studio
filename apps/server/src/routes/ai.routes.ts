import { Router } from "express";
import {
  clarifyPromptHandler,
  generateBlueprintHandler,
  generateCodeHandler,
} from "../controllers/ai.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.post("/clarify", clarifyPromptHandler);
router.post("/blueprint", generateBlueprintHandler);
router.post("/generate", generateCodeHandler);

export default router;
