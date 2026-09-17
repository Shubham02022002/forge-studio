import { Router } from "express";
import multer from "multer";
import { transcribeAudioHandler } from "../controllers/voice.controller.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.post("/transcribe", upload.single("audio"), transcribeAudioHandler);

export default router;
