"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { signOut, type SessionUser } from "@/lib/api";
import { cn } from "@/lib/cn";

function initialOf(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.trim() || "?";
  return source.slice(0, 1).toUpperCase();
}

export function AccountMenu() {
  const user = useAuth();

  if (!user) {
    return (
      <Link
        href="/signin"
        title="Sign in"
        aria-label="Sign in"
        className="grid size-8 place-items-center rounded-full border border-line-strong bg-elevated text-muted transition-colors hover:border-forge-line hover:text-ink"
      >
        <LogIn className="size-3.5" strokeWidth={2} />
      </Link>
    );
  }

  return <SignedInMenu user={user} />;
}

function SignedInMenu({ user }: { user: SessionUser }) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function onSignOut() {
    setPending(true);

    try {
      await signOut();
      router.replace("/signin");
      router.refresh();
    } catch {
      setPending(false);
    }
  }

  return (
    <div ref={root} className="relative flex flex-col items-center">
      <button
        type="button"
        title="Account"
        aria-label="Account"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "grid size-8 place-items-center overflow-hidden rounded-full border text-[11px] font-semibold transition-colors",
          open
            ? "border-forge-line bg-forge-soft text-forge"
            : "border-line-strong bg-elevated text-muted hover:border-forge-line hover:text-ink",
        )}
      >
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt=""
            width={32}
            height={32}
            className="size-8 object-cover"
          />
        ) : (
          initialOf(user.name, user.email)
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-0 left-full z-50 ml-2 w-[232px] overflow-hidden rounded-lg border border-line-strong bg-panel shadow-pop"
        >
          <div className="flex items-center gap-2.5 border-b border-line px-3 py-2.5">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt=""
                width={28}
                height={28}
                className="size-7 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="grid size-7 shrink-0 place-items-center rounded-full border border-line-strong bg-elevated text-[11px] font-semibold text-muted">
                {initialOf(user.name, user.email)}
              </span>
            )}

            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-ink">
                {user.name ?? "Your account"}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-faint">
                {user.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={onSignOut}
            disabled={pending}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-muted transition-colors hover:bg-elevated hover:text-ink disabled:opacity-50"
          >
            <LogOut className="size-3.5" strokeWidth={1.9} />
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
