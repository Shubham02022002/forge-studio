import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../config/db.js";
import { SESSION_TTL_MS } from "../config/auth.js";
import { PUBLIC_USER_SELECT } from "../utils/user.js";

const TOKEN_BYTES = 32;

export interface CreatedSession {
  token: string;
  expiresAt: Date;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<CreatedSession> {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: { id: hashToken(token), userId, expiresAt },
  });

  return { token, expiresAt };
}

export async function getSessionUser(token: string) {
  const id = hashToken(token);

  const session = await prisma.session.findUnique({
    where: { id },
    select: {
      expiresAt: true,
      user: { select: PUBLIC_USER_SELECT },
    },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.deleteMany({ where: { id } });
    return null;
  }

  return session.user;
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { id: hashToken(token) } });
}
