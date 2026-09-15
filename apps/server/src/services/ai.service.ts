import { groq } from "../config/groq.js";
import { ClarificationResponse, ProductBlueprint } from "../types/ai.js";
const FAST_MODEL = "openai/gpt-oss-20b";
const POWER_MODEL = "openai/gpt-oss-120b";

export async function evaluatePromptAmbiguity(
  prompt: string,
): Promise<ClarificationResponse> {
  const systemPrompt = `You are a Senior Product Architect at Forge Studio, an elite full-stack application
  builder.
  Your job is to analyze the user's software idea and determine if it has enough technical detail to build a
  production-grade application without producing generic "AI slop".

  Evaluate the prompt against:
  1. Core features & user workflows
  2. Database entities and relationships
  3. Authentication & user roles
  4. UI layout & design style

  If the prompt is vague (e.g. "Build an Airbnb clone", "Make a fitness app", "Create a CRM"), mark isAmbiguous as
  true, give a completenessScore (< 75), and provide 2 to 4 high-leverage multiple-choice questions with 3-4
  distinct options each.

  If the prompt is already comprehensive and specific, mark isAmbiguous as false, completenessScore >= 75, and omit
  questions.

  You MUST reply with valid JSON matching this schema:
  {
    "isAmbiguous": boolean,
    "completenessScore": number (0-100),
    "summary": "One sentence summary of the project understanding",
    "questions": [
      {
        "id": "q1",
        "category": "features" | "auth" | "database" | "design",
        "question": "Clear, concise technical question?",
        "options": ["Option A", "Option B", "Option C"]
      }
    ]
  }`;
  const completion = await groq.chat.completions.create({
    model: FAST_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `User Prompt: "${prompt}"` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Failed to get response from AI model");
  }

  return JSON.parse(content) as ClarificationResponse;
}

export async function generateProductBlueprint(
  prompt: string,
  clarifications: Record<string, string>,
): Promise<ProductBlueprint> {
  const systemPrompt = `You are a Principal Software Architect and Design System Lead at Forge Studio.
  Generate a structured, production-ready Product Specification Blueprint based on the user's idea and clarification
  answers.

  Strict Anti-Slop Guidelines:
  - Design: Clean modern aesthetics (Zinc/Slate neutral baseline, sharp typography, Radix/Shadcn UI style).
  - No unnecessary neon gradients or fake dummy components.
  - Data models must be realistic and functional with proper TypeScript entity types.

  You MUST reply with valid JSON matching this schema:
  {
    "title": "Clean Project Title",
    "description": "2-3 sentence technical overview",
    "targetAudience": "Target user persona",
    "designSystem": {
      "primaryColor": "e.g. indigo-600, emerald-600, sky-500",
      "neutralBase": "zinc" | "slate",
      "typography": {
        "headingFont": "Inter",
        "bodyFont": "Inter"
      },
      "layoutPattern": "sidebar-layout" | "navbar-layout" | "canvas-layout"
    },
    "features": ["Feature 1", "Feature 2", "Feature 3"],
    "entityModels": [
      {
        "name": "EntityName",
        "fields": ["id: string", "name: string", "createdAt: Date"]
      }
    ],
    "suggestedPackages": ["lucide-react", "clsx", "tailwind-merge", "recharts"]
  }`;

  const userContext = `
  Initial Prompt: ${prompt}
  Clarification Answers: ${JSON.stringify(clarifications, null, 2)}
  `;

  const completion = await groq.chat.completions.create({
    model: POWER_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContext },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Failed to generate product blueprint");
  }

  return JSON.parse(content) as ProductBlueprint;
}
