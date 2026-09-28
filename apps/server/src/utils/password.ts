import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

const ABSENT_ACCOUNT_HASH =
  "$2b$12$IE4yLb0kRWRINg8jmH.wOugAQB4Zn/nrQa9mP9Qfu3/NGgWmuxLAK";

export const MAX_PASSWORD_BYTES = 72;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string | null,
): Promise<boolean> {
  if (!hash) {
    await bcrypt.compare(plain, ABSENT_ACCOUNT_HASH);
    return false;
  }

  return bcrypt.compare(plain, hash);
}
