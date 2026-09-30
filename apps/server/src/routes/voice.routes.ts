import { Router } from "express";
import multer from "multer";
import { transcribeAudioHandler } from "../controllers/voice.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  requireAiProvider,
  translateAiError,
} from "../middleware/ai.middleware.js";
import { voiceLimiter } from "../middleware/rate-limit.middleware.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.use(requireAuth);
router.use(requireAiProvider);

router.post(
  "/transcribe",
  voiceLimiter,
  upload.single("audio"),
  transcribeAudioHandler,
);

router.use(translateAiError);

export default router;
