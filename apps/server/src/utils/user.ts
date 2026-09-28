import { Prisma } from "@prisma/client";

export const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  githubUsername: true,
  createdAt: true,
} as const;

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof PUBLIC_USER_SELECT;
}>;
