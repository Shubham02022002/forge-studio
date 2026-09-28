import Link from "next/link";
import { redirect } from "next/navigation";
import { ForgeLogo } from "@/components/ui/forge-mark";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getSessionUser } from "@/lib/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (user) redirect("/workspace");

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div className="grid-veil pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-forge/[0.07] blur-[120px]" />

      <header className="relative z-10 flex h-16 items-center justify-between px-6 lg:px-10">
        <Link href="/" aria-label="Forge Studio home">
          <ForgeLogo />
        </Link>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-24">
        {children}
      </main>
    </div>
  );
}
