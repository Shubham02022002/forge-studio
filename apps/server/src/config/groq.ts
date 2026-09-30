import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

export function groqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

if (!groqConfigured()) {
  console.error(
    "[Forge Studio] GROQ_API_KEY is not set. Every AI request will be refused with a 503 until it is configured.",
  );
}

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});
