import { Request, Response, NextFunction } from "express";
import { transcribeAndRefineVoice } from "../services/voice.service.js";

export async function transcribeAudioHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const file = req.file;

    if (!file) {
      res.status(400).json({
        error:
          'No audio file uploaded. Send audio as "audio" multipart/form-data.',
      });
      return;
    }

    const { buffer, originalname, mimetype } = file;

    const result = await transcribeAndRefineVoice(
      buffer,
      originalname || "recording.webm",
      mimetype || "audio/webm",
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
