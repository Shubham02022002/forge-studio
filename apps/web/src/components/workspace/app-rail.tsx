"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FolderClosed, Plus, Settings, Sparkles } from "lucide-react";
import { ForgeMark } from "@/components/ui/forge-mark";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/workspace", label: "Build", icon: Sparkles },
  { href: "/projects", label: "Projects", icon: FolderClosed },
  { href: "/docs", label: "Docs", icon: BookOpen },
];

export function AppRail() {
  const pathname = usePathname();

  return (
    <nav className="flex w-[52px] shrink-0 flex-col items-center gap-1 border-r border-line bg-panel py-3">
      <Link
        href="/"
        aria-label="Forge Studio home"
        className="mb-2 grid size-8 place-items-center rounded-md transition-colors hover:bg-elevated"
      >
        <ForgeMark />
      </Link>

      <button
        type="button"
        aria-label="New project"
        className="mb-2 grid size-8 place-items-center rounded-md border border-forge-line bg-forge-soft text-forge transition-colors hover:bg-forge/20"
      >
        <Plus className="size-4" strokeWidth={2.25} />
      </button>

      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            title={label}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "grid size-8 place-items-center rounded-md transition-colors",
              active
                ? "bg-elevated text-ink"
                : "text-faint hover:bg-elevated hover:text-muted",
            )}
          >
            <Icon className="size-4" strokeWidth={1.9} />
          </Link>
        );
      })}

      <div className="mt-auto flex flex-col items-center gap-1">
        <ThemeToggle />
        <button
          type="button"
          title="Settings"
          aria-label="Settings"
          className="grid size-8 place-items-center rounded-md text-faint transition-colors hover:bg-elevated hover:text-muted"
        >
          <Settings className="size-4" strokeWidth={1.9} />
        </button>
        <button
          type="button"
          title="Account"
          aria-label="Account"
          className="grid size-8 place-items-center rounded-full border border-line-strong bg-elevated text-[11px] font-semibold text-muted transition-colors hover:border-forge-line hover:text-ink"
        >
          C
        </button>
      </div>
    </nav>
  );
}
