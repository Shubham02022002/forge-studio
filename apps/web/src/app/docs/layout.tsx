import { AuthProvider } from "@/components/auth/auth-provider";
import { getSessionUser } from "@/lib/session";

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return <AuthProvider user={user}>{children}</AuthProvider>;
}
