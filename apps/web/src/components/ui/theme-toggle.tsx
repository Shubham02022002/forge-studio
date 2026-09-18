"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

export function ThemeToggle({ className }: { className?: string }) {
  function toggle() {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.toggle("dark", !wasDark);
    try {
      localStorage.setItem("forge-theme", wasDark ? "light" : "dark");
    } catch {
      return;
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title="Toggle theme"
      aria-label="Toggle theme"
      className={cn(
        "grid size-8 place-items-center rounded-md text-faint transition-colors",
        "hover:bg-elevated hover:text-muted",
        className,
      )}
    >
      <Sun className="hidden size-4 dark:block" strokeWidth={1.9} />
      <Moon className="block size-4 dark:hidden" strokeWidth={1.9} />
    </button>
  );
}
