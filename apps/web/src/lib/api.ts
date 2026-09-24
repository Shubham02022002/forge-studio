export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export type ProjectStatus = "DRAFT" | "GENERATING" | "READY" | "FAILED";

export interface ProjectSummary {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiError {
  error: string;
  message?: string;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiRequestError(
      `Could not reach the Forge API at ${API_URL}. Is the server running?`,
    );
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiError | null;
    throw new ApiRequestError(
      body?.message ?? body?.error ?? `Request failed (${res.status})`,
      res.status,
    );
  }

  const body = (await res.json()) as ApiSuccess<T>;
  return body.data;
}

export function getProjects() {
  return request<ProjectSummary[]>("/api/projects");
}

export type ClarificationCategory = "features" | "auth" | "database" | "design";

export interface ClarificationQuestion {
  id: string;
  category: ClarificationCategory;
  question: string;
  options: string[];
  allowCustomInput?: boolean;
}

export interface ClarificationResponse {
  isAmbiguous: boolean;
  completenessScore: number;
  summary: string;
  questions?: ClarificationQuestion[];
}

export interface ProductBlueprint {
  title: string;
  description: string;
  targetAudience: string;
  designSystem: {
    primaryColor: string;
    neutralBase: string;
    typography: { headingFont: string; bodyFont: string };
    layoutPattern: "sidebar-layout" | "navbar-layout" | "canvas-layout";
  };
  features: string[];
  entityModels: Array<{ name: string; fields: string[] }>;
  suggestedPackages: string[];
}

export function clarifyPrompt(prompt: string) {
  return request<ClarificationResponse>("/api/ai/clarify", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
}

export function generateBlueprint(
  prompt: string,
  clarifications: Record<string, string>,
) {
  return request<ProductBlueprint>("/api/ai/blueprint", {
    method: "POST",
    body: JSON.stringify({ prompt, clarifications }),
  });
}

export interface VoiceTranscriptionResult {
  rawTranscript: string;
  refinedPrompt: string;
}

export function transcribeAudio(audio: Blob, filename = "recording.webm") {
  const form = new FormData();
  form.append("audio", audio, filename);
  return request<VoiceTranscriptionResult>("/api/voice/transcribe", {
    method: "POST",
    body: form,
  });
}

export interface CreatedProject {
  id: string;
  title: string;
  status: ProjectStatus;
}

export function createProject(input: {
  title: string;
  description?: string;
  prompt: string;
}) {
  return request<CreatedProject>("/api/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface ProjectDetail {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  blueprint: ProductBlueprint | null;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    role: string;
    type: string;
    content: string;
    metadata: Record<string, unknown> | null;
    createdAt: string;
  }>;
}

export function getProject(id: string) {
  return request<ProjectDetail>(`/api/projects/${id}`);
}

export interface GenerationStreamHandlers {
  onStatus?: (message: string) => void;
  onChunk?: (text: string) => void;
  onDone?: (message: string) => void;
  onError?: (message: string) => void;
}

function dispatchFrame(frame: string, handlers: GenerationStreamHandlers): void {
  let event = "message";
  const data: string[] = [];

  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data.push(line.slice(5).trim());
  }

  if (data.length === 0) return;

  let payload: { message?: string; text?: string };
  try {
    payload = JSON.parse(data.join("\n")) as { message?: string; text?: string };
  } catch {
    return;
  }

  if (event === "status") handlers.onStatus?.(payload.message ?? "");
  else if (event === "chunk") handlers.onChunk?.(payload.text ?? "");
  else if (event === "done") handlers.onDone?.(payload.message ?? "");
  else if (event === "error")
    handlers.onError?.(payload.message ?? "Generation failed.");
}

export interface GenerationFileInput {
  path: string;
  content: string;
}

export async function streamGeneration(
  input: {
    projectId: string;
    prompt: string;
    blueprint?: ProductBlueprint;
    mode?: "create" | "edit";
    files?: GenerationFileInput[];
  },
  handlers: GenerationStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/ai/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as
      | { error?: string; message?: string }
      | null;
    throw new ApiRequestError(
      body?.message ?? body?.error ?? `Generation failed (${res.status})`,
      res.status,
    );
  }

  if (!res.body) {
    throw new ApiRequestError("Streaming is not supported in this browser.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let separator = buffer.indexOf("\n\n");
    while (separator !== -1) {
      const frame = buffer.slice(0, separator);
      buffer = buffer.slice(separator + 2);
      if (frame.trim()) dispatchFrame(frame, handlers);
      separator = buffer.indexOf("\n\n");
    }
  }
}
