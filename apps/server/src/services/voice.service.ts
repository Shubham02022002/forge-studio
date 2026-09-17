import { groq } from "../config/groq.js";
import { toFile } from "groq-sdk";

const WHISPER_MODEL = "whisper-large-v3-turbo";
const REFINER_MODEL = "openai/gpt-oss-20b";

export interface VoiceTranscriptionResult {
  rawTranscript: string;
  refinedPrompt: string;
}

export async function transcribeAndRefineVoice(
  audioBuffer: Buffer,
  filename: string = "audio.webm",
  mimeType: string = "audio/webm",
): Promise<VoiceTranscriptionResult> {
  const file = await toFile(audioBuffer, filename, { type: mimeType });

  const transcription = await groq.audio.transcriptions.create({
    file,
    model: WHISPER_MODEL,
    language: "en",
    response_format: "json",
    temperature: 0.0,
  });

  const rawTranscript = transcription.text?.trim() || "";

  if (!rawTranscript) {
    return {
      rawTranscript: "",
      refinedPrompt: "",
    };
  }

  const refinerSystemPrompt = `You are a Technical Prompt Engineer at Forge Studio.
Your job is to take raw, conversational spoken voice transcripts and convert them into clear, actionable software engineering prompts.

Rules:
- Remove filler words ("um", "uh", "like", "you know", "basically", "so yeah").
- Preserve all user intent, features, entities, and design preferences.
- Format as a concise, high-quality software requirement prompt.
- Do not answer the prompt or add conversational commentary. Return ONLY the refined prompt text.`;

  const refinementResponse = await groq.chat.completions.create({
    model: REFINER_MODEL,
    messages: [
      { role: "system", content: refinerSystemPrompt },
      { role: "user", content: `Raw Spoken Transcript: "${rawTranscript}"` },
    ],
    temperature: 0.1,
  });

  const refinedPrompt =
    refinementResponse.choices[0]?.message?.content?.trim() || rawTranscript;

  return {
    rawTranscript,
    refinedPrompt,
  };
}
