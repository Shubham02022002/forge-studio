import { Prisma } from "@prisma/client";
import { prisma } from "../config/db.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { PUBLIC_USER_SELECT, type PublicUser } from "../utils/user.js";
import type { SigninInput, SignupInput } from "../types/auth.schema.js";
import type { GithubProfile } from "./github.service.js";

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

export type GithubAuthResult =
  | { ok: true; user: PublicUser }
  | { ok: false; reason: "email-linked" | "signin-failed"; message: string };

export async function signInWithGithub(
  profile: GithubProfile,
): Promise<GithubAuthResult> {
  const grants = {
    githubUsername: profile.username,
    avatarUrl: profile.avatarUrl,
    githubAccessToken: profile.accessToken,
    name: profile.name,
  };

  const linked = await prisma.user.findUnique({
    where: { githubId: profile.githubId },
    select: { id: true },
  });

  if (linked) {
    return {
      ok: true,
      user: await prisma.user.update({
        where: { id: linked.id },
        data: grants,
        select: PUBLIC_USER_SELECT,
      }),
    };
  }

  const emailOwner = await prisma.user.findUnique({
    where: { email: profile.email },
    select: { id: true },
  });

  if (emailOwner) {
    return {
      ok: false,
      reason: "email-linked",
      message:
        "An account with that email already exists. Sign in with your password instead.",
    };
  }

  try {
    return {
      ok: true,
      user: await prisma.user.create({
        data: { ...grants, email: profile.email, githubId: profile.githubId },
        select: PUBLIC_USER_SELECT,
      }),
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const raced = await prisma.user.findUnique({
        where: { githubId: profile.githubId },
        select: PUBLIC_USER_SELECT,
      });

      if (raced) return { ok: true, user: raced };

      return {
        ok: false,
        reason: "signin-failed",
        message: "That account could not be created. Please try again.",
      };
    }

    throw error;
  }
}
