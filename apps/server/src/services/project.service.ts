import { prisma } from "../config/db.js";
import { Prisma, ProjectStatus } from "@prisma/client";
import type {
  CreateProjectInput,
  UpdateProjectInput,
  CreateMessageInput,
} from "../types/project.schema.js";

function isMissingRecord(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

export async function createProject(
  input: CreateProjectInput,
  userId: string,
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

export async function listProjects(userId: string) {
  return prisma.project.findMany({
    where: { userId },
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

export async function getProjectById(id: string, userId: string) {
  return prisma.project.findFirst({
    where: { id, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput,
  userId: string,
) {
  try {
    return await prisma.project.update({
      where: { id, userId },
      data: {
        title: input.title,
        description: input.description,
        isPublic: input.isPublic,
        ...(input.blueprint !== undefined && {
          blueprint: input.blueprint as Prisma.InputJsonValue,
        }),
      },
    });
  } catch (error) {
    if (isMissingRecord(error)) return null;
    throw error;
  }
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

export async function deleteProject(
  id: string,
  userId: string,
): Promise<boolean> {
  try {
    await prisma.project.delete({ where: { id, userId } });
    return true;
  } catch (error) {
    if (isMissingRecord(error)) return false;
    throw error;
  }
}
