import { z } from "zod";

export const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required").max(120, "Title is too long"),
  description: z.string().max(500).optional(),
  prompt: z
    .string()
    .min(10, "Prompt must be at least 10 characters")
    .max(4000, "Prompt is too long"),
});

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  status: z
    .enum(["DRAFT", "CLARIFYING", "READY", "GENERATING", "COMPLETED"])
    .optional(),
  blueprint: z.record(z.string(), z.unknown()).optional(),
  isPublic: z.boolean().optional(),
});

export const createMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  type: z.enum(["chat", "clarification", "blueprint", "code"]).default("chat"),
  content: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const projectIdParamSchema = z.object({
  id: z.uuid("Invalid project ID format"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
