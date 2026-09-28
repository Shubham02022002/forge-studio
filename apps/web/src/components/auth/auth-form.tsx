"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signIn, signUp } from "@/lib/api";

const field =
  "h-9 w-full rounded-md border border-line-strong bg-elevated px-3 text-[13px] text-ink placeholder:text-faint";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const isSignup = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      if (isSignup) {
        await signUp({ email, password, name: name.trim() || undefined });
      } else {
        await signIn({ email, password });
      }

      router.replace("/workspace");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-[380px]">
      <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
        {isSignup ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        {isSignup
          ? "Forge keeps your projects, blueprints and generated code in one place."
          : "Sign in to pick up where you left off."}
      </p>

      <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-3">
        {isSignup && (
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] text-muted">Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              placeholder="Ada Lovelace"
              className={field}
            />
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] text-muted">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            className={field}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] text-muted">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={isSignup ? "new-password" : "current-password"}
            placeholder={isSignup ? "At least 8 characters" : "Your password"}
            className={field}
          />
        </label>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2">
            <AlertTriangle
              className="mt-px size-3.5 shrink-0 text-danger"
              strokeWidth={2}
            />
            <p className="text-[12px] leading-relaxed text-danger">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={pending}
          className="mt-1 w-full"
        >
          {pending && (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={2.25} />
          )}
          {isSignup ? "Create account" : "Sign in"}
        </Button>
      </form>

      <p className="mt-5 text-[13px] text-faint">
        {isSignup ? "Already have an account? " : "New to Forge? "}
        <Link
          href={isSignup ? "/signin" : "/signup"}
          className="text-forge transition-opacity hover:opacity-80"
        >
          {isSignup ? "Sign in" : "Create one"}
        </Link>
      </p>
    </div>
  );
}
