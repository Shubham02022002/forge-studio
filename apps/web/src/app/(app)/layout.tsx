import { redirect } from "next/navigation";
import { AuthProvider } from "@/components/auth/auth-provider";
import { getSessionUser } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) redirect("/signin");

  return <AuthProvider user={user}>{children}</AuthProvider>;
}
