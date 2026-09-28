import { Prisma } from "@prisma/client";
import { prisma } from "../config/db.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { PUBLIC_USER_SELECT, type PublicUser } from "../utils/user.js";
import type { SigninInput, SignupInput } from "../types/auth.schema.js";

export type AuthResult =
  | { ok: true; user: PublicUser }
  | {
      ok: false;
      reason: "email-taken" | "invalid-credentials";
      message: string;
    };

export async function signUp(input: SignupInput): Promise<AuthResult> {
  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name ?? null,
        passwordHash: await hashPassword(input.password),
      },
      select: PUBLIC_USER_SELECT,
    });

    return { ok: true, user };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        reason: "email-taken",
        message: "An account with that email already exists.",
      };
    }

    throw error;
  }
}

export async function signIn(input: SigninInput): Promise<AuthResult> {
  const account = await prisma.user.findUnique({
    where: { email: input.email },
    select: { ...PUBLIC_USER_SELECT, passwordHash: true },
  });

  const valid = await verifyPassword(
    input.password,
    account?.passwordHash ?? null,
  );

  if (!account || !valid) {
    return {
      ok: false,
      reason: "invalid-credentials",
      message: "Incorrect email or password.",
    };
  }

  const { passwordHash: _passwordHash, ...user } = account;
  return { ok: true, user };
}
