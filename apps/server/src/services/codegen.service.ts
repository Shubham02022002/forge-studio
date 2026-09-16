import { Response } from "express";
import { groq } from "../config/groq.js";
import { buildCodeGenSystemPrompt } from "../prompts/codegen.prompt.js";
import { ProductBlueprint } from "../types/ai.js";
import { prisma } from "../config/db.js";
import { ProjectStatus } from "@prisma/client";

const CODE_MODEL = "openai/gpt-oss-120b"; 

interface StreamCodeGenOptions {
  projectId: string;
  prompt: string;
  blueprint?: ProductBlueprint;
  res: Response;
}

export async function streamCodeGeneration({
  projectId,
  prompt,
  blueprint,
  res,
}: StreamCodeGenOptions): Promise<void> {

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", 
  });

  res.flushHeaders?.();

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  let fullContent = "";

  try {
    sendEvent("status", { message: "Initializing generation pipeline..." });

    await prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.GENERATING },
    });

    const systemPrompt = buildCodeGenSystemPrompt(blueprint);
    const userPrompt = blueprint
      ? `Generate the complete application for "${blueprint.title}".
  Overview: ${blueprint.description}
  Features to implement:
  ${blueprint.features.map((f) => `- ${f}`).join("\n")}

  User Original Prompt: ${prompt}`
      : `Generate the complete application based on: ${prompt}`;

    sendEvent("status", { message: "Streaming code artifacts..." });

    const stream = await groq.chat.completions.create({
      model: CODE_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 8192,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        fullContent += text;
        sendEvent("chunk", { text });
      }
    }

    await prisma.message.create({
      data: {
        projectId,
        role: "assistant",
        type: "code",
        content: fullContent,
      },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.READY },
    });

    sendEvent("done", { message: "Code generation completed successfully." });
  } catch (error) {
    console.error("Error during code generation streaming:", error);
    sendEvent("error", {
      message: error instanceof Error ? error.message : "Generation failed",
    });
  } finally {
    res.end();
  }
}
