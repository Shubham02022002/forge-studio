import { Response } from "express";
import { groq } from "../config/groq.js";
import {
  buildCodeGenSystemPrompt,
  buildCodeGenUserPrompt,
  buildEditUserPrompt,
  type CodeGenMode,
} from "../prompts/codegen.prompt.js";
import { ProductBlueprint } from "../types/ai.js";
import { prisma } from "../config/db.js";
import { ProjectStatus } from "@prisma/client";
import {
  ARTIFACT_CLOSE,
  buildArtifactOpen,
  buildArtifactPreamble,
  buildScaffold,
  type ScaffoldFile,
} from "../templates/scaffold.js";
import { normalizeEscaping } from "../utils/normalize.js";

const CODE_MODEL = "openai/gpt-oss-120b";
const CODE_MAX_TOKENS = 16000;

interface StreamCodeGenOptions {
  projectId: string;
  prompt: string;
  blueprint?: ProductBlueprint;
  mode: CodeGenMode;
  files?: ScaffoldFile[];
  res: Response;
}

export async function streamCodeGeneration({
  projectId,
  prompt,
  blueprint,
  mode,
  files,
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

    const editing = mode === "edit";
    const title = blueprint?.title ?? "Generated app";

    sendEvent("status", {
      message: editing
        ? "Reading the current codebase..."
        : "Assembling the project scaffold...",
    });

    if (editing) {
      const open = buildArtifactOpen(title);
      fullContent += open;
      sendEvent("chunk", { text: open });
    } else {
      const scaffold = buildScaffold({
        title,
        primaryColor: blueprint?.designSystem.primaryColor,
      });
      const preamble = buildArtifactPreamble(title, scaffold);
      fullContent += preamble;
      sendEvent("chunk", { text: preamble });
    }

    const systemPrompt = buildCodeGenSystemPrompt(blueprint, mode);
    const userPrompt = editing
      ? buildEditUserPrompt(prompt, files ?? [])
      : buildCodeGenUserPrompt(prompt, blueprint);

    sendEvent("status", {
      message: editing ? "Applying the change..." : "Streaming code artifacts...",
    });

    const stream = await groq.chat.completions.create({
      model: CODE_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: CODE_MAX_TOKENS,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        fullContent += text;
        sendEvent("chunk", { text });
      }
    }

    fullContent += ARTIFACT_CLOSE;
    sendEvent("chunk", { text: ARTIFACT_CLOSE });

    const storedContent = normalizeEscaping(fullContent);

    await prisma.message.create({
      data: {
        projectId,
        role: "assistant",
        type: "code",
        content: storedContent,
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
