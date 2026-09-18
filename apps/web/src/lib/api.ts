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
