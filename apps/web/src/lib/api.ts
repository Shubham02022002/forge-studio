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
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
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
