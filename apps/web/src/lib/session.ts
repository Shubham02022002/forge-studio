import { cookies } from "next/headers";
import { API_URL, type SessionUser } from "@/lib/api";

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { cookie: cookieStore.toString() },
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  const body = (await res.json().catch(() => null)) as {
    data?: SessionUser;
  } | null;

  return body?.data ?? null;
}
