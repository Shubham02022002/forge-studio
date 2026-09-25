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
import {
  estimateTokens,
  isTokenLimitError,
  MODEL_TPM_LIMIT,
  REQUEST_TOKEN_BUDGET,
} from "../utils/tokens.js";
import { buildEditContext, type EditContext } from "./context.service.js";

const CODE_MODEL = "openai/gpt-oss-120b";
const CODE_MAX_TOKENS = 16000;
const RETRY_BUDGET_FACTOR = 0.7;

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
    const codeFiles = files ?? [];

    const systemPrompt = buildCodeGenSystemPrompt(blueprint, mode);
    let userPrompt: string;
    let editContext: EditContext | null = null;

    if (editing) {
      sendEvent("status", { message: "Reading the current codebase..." });

      const budget = REQUEST_TOKEN_BUDGET - estimateTokens(systemPrompt);
      editContext = await buildEditContext(prompt, codeFiles, budget);
      userPrompt = buildEditUserPrompt(prompt, editContext.files, {
        outline: editContext.outline,
        totalFiles: editContext.totalFiles,
      });
    } else {
      sendEvent("status", { message: "Assembling the project scaffold..." });

      const scaffold = buildScaffold({
        title,
        primaryColor: blueprint?.designSystem.primaryColor,
      });
      const preamble = buildArtifactPreamble(title, scaffold);
      fullContent += preamble;
      sendEvent("chunk", { text: preamble });

      userPrompt = buildCodeGenUserPrompt(prompt, blueprint);
    }

    const requestTokens = estimateTokens(systemPrompt) + estimateTokens(userPrompt);

    if (requestTokens > MODEL_TPM_LIMIT) {
      sendEvent("error", {
        message: `This request needs about ${requestTokens.toLocaleString()} tokens, and the current model plan allows ${MODEL_TPM_LIMIT.toLocaleString()} per minute. Try describing a smaller change.`,
      });
      return;
    }

    if (editing) {
      const open = buildArtifactOpen(title);
      fullContent += open;
      sendEvent("chunk", { text: open });
    }

    const openStream = (sys: string, usr: string) =>
      groq.chat.completions.create({
        model: CODE_MODEL,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: usr },
        ],
        temperature: 0.2,
        max_tokens: CODE_MAX_TOKENS,
        stream: true,
      });

    let stream: Awaited<ReturnType<typeof openStream>> | null = null;

    try {
      stream = await openStream(systemPrompt, userPrompt);
    } catch (error) {
      if (!editing || !isTokenLimitError(error)) throw error;

      sendEvent("status", {
        message: "The codebase exceeded the model limit — narrowing to the files this change needs...",
      });

      const budget = Math.floor(
        (REQUEST_TOKEN_BUDGET - estimateTokens(systemPrompt)) * RETRY_BUDGET_FACTOR,
      );

      editContext = await buildEditContext(prompt, codeFiles, budget, {
        forceSelection: true,
      });
      userPrompt = buildEditUserPrompt(prompt, editContext.files, {
        outline: editContext.outline,
        totalFiles: editContext.totalFiles,
      });

      stream = await openStream(systemPrompt, userPrompt);
    }

    if (!stream) throw new Error("The model stream could not be opened.");

    sendEvent("status", {
      message: editContext
        ? editContext.mode === "full"
          ? "Applying the change..."
          : `Applying the change across ${editContext.files.length} of ${editContext.totalFiles} files...`
        : "Streaming code artifacts...",
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
      message: isTokenLimitError(error)
        ? "The model's per-minute token limit was reached. Wait a moment and try the change again."
        : error instanceof Error
          ? error.message
          : "Generation failed",
    });
  } finally {
    res.end();
  }
}
