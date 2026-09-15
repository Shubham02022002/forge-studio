import { prisma } from "../config/db.js";
import { Prisma, ProjectStatus } from "@prisma/client";
import type {
  CreateProjectInput,
  UpdateProjectInput,
  CreateMessageInput,
} from "../types/project.schema.js";

export async function createProject(
  input: CreateProjectInput,
  userId?: string,
) {
  return prisma.project.create({
    data: {
      title: input.title,
      description: input.description,
      userId,
      status: ProjectStatus.DRAFT,
      messages: {
        create: {
          role: "user",
          type: "chat",
          content: input.prompt,
        },
      },
    },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function listProjects(userId?: string) {
  return prisma.project.findMany({
    where: userId ? { userId } : {},
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });
}

export async function getProjectById(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
}

export async function updateProject(id: string, input: UpdateProjectInput) {
  return prisma.project.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description,
      status: input.status,
      isPublic: input.isPublic,
      ...(input.blueprint !== undefined && {
        blueprint: input.blueprint as Prisma.InputJsonValue,
      }),
    },
  });
}

export async function addMessage(projectId: string, input: CreateMessageInput) {
  return prisma.message.create({
    data: {
      projectId,
      role: input.role,
      type: input.type,
      content: input.content,
      metadata: (input.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    },
  });
}

export async function deleteProject(id: string) {
  return prisma.project.delete({ where: { id } });
}
