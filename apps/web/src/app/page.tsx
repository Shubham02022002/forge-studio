import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  GitBranch,
  MessageCircleQuestion,
  Palette,
} from "lucide-react";
import { ForgeLogo } from "@/components/ui/forge-mark";
import { buttonClass } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const features = [
  {
    icon: AudioLines,
    title: "Built for voice",
    body: "Hold space and talk. Whisper transcribes, then Forge rewrites the rambling into a precise build spec.",
  },
  {
    icon: MessageCircleQuestion,
    title: "It asks first",
    body: "Vague prompts get questions, not guesses. Forge keeps asking until the spec is complete.",
  },
  {
    icon: Palette,
    title: "No AI slop",
    body: "Every generation runs against an enforced design system, so the output looks shipped, not generated.",
  },
  {
    icon: GitBranch,
    title: "Your code, your repo",
    body: "Push the whole codebase to your own GitHub with real commit history. No lock-in, no export tax.",
  },
];

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div className="grid-veil pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-forge/[0.07] blur-[120px]" />

      <header className="relative z-10 flex h-16 items-center justify-between px-6 lg:px-10">
        <ForgeLogo />
        <nav className="hidden items-center gap-7 text-[13px] text-muted md:flex">
          <Link href="/workspace" className="transition-colors hover:text-ink">
            Workspace
          </Link>
          <Link href="/docs" className="transition-colors hover:text-ink">
            Docs
          </Link>
          <Link href="/projects" className="transition-colors hover:text-ink">
            Projects
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/workspace" className={buttonClass("secondary", "sm")}>
            Sign in
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center px-6 pb-24 pt-16 lg:pt-24">
        <div className="animate-rise flex w-full max-w-3xl flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-panel/60 px-3 py-1 text-[12px] text-muted backdrop-blur">
            <span className="size-1.5 rounded-full bg-forge" />
            Voice-first app builder
          </span>

          <h1 className="text-balance-tight mt-6 text-[44px] font-semibold leading-[1.05] text-ink sm:text-[60px]">
            Describe it.
            <br />
            Forge builds it.
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-[15px] leading-relaxed text-muted">
            Turn a spoken idea into a real full-stack application. Forge asks
            the questions that matter, writes the code, runs it in a sandbox,
            and pushes it to your own GitHub.
          </p>

          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/workspace"
              className={buttonClass("primary", "md", "h-10 px-5")}
            >
              Start building
              <ArrowRight className="size-4" strokeWidth={2.25} />
            </Link>
            <Link
              href="/docs"
              className={buttonClass("outline", "md", "h-10 px-5")}
            >
              See how it works
            </Link>
          </div>
        </div>

        <div
          className="animate-rise mt-16 w-full max-w-3xl"
          style={{ animationDelay: "120ms" }}
        >
          <div className="rounded-xl border border-line-strong bg-panel/70 p-1.5 shadow-panel backdrop-blur">
            <div className="flex items-center gap-1.5 px-2.5 py-2">
              <span className="size-2.5 rounded-full bg-line-strong" />
              <span className="size-2.5 rounded-full bg-line-strong" />
              <span className="size-2.5 rounded-full bg-line-strong" />
              <span className="ml-3 font-mono text-[11px] text-faint">
                forge.studio/workspace
              </span>
            </div>

            <div className="grid gap-1.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
              <div className="rounded-lg border border-line bg-canvas p-4">
                <div className="flex items-center gap-2 text-[11px] text-faint">
                  <AudioLines className="size-3.5 text-forge" strokeWidth={2} />
                  refining transcript…
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-muted">
                  <span className="text-faint line-through decoration-line-strong">
                    so I want like a dashboard for crypto wallets with charts
                    and uh, dark mode
                  </span>
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-ink">
                  A dashboard showing wallet balances with interactive charts, a
                  dark theme by default, and tabs for transactions and settings.
                </p>
              </div>

              <div className="rounded-lg border border-line bg-canvas p-4">
                <div className="flex items-center gap-1.5">
                  <span className="rounded-sm bg-elevated px-2 py-0.5 text-[11px] text-muted">
                    Preview
                  </span>
                  <span className="rounded-sm px-2 py-0.5 text-[11px] text-faint">
                    Code
                  </span>
                </div>
                <div className="mt-4 space-y-2.5">
                  <div className="h-2 w-1/3 rounded-full bg-line-strong" />
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-14 rounded-md border border-line bg-panel" />
                    <div className="h-14 rounded-md border border-line bg-panel" />
                    <div className="h-14 rounded-md border border-forge-line bg-forge-soft" />
                  </div>
                  <div className="h-20 rounded-md border border-line bg-panel" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="animate-rise mt-20 grid w-full max-w-4xl gap-x-10 gap-y-9 text-left sm:grid-cols-2"
          style={{ animationDelay: "200ms" }}
        >
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3.5">
              <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md border border-line bg-panel">
                <Icon className="size-4 text-muted" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-[13px] font-medium text-ink">{title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-faint">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 border-t border-line px-6 py-6 lg:px-10">
        <div className="flex flex-col items-center justify-between gap-3 text-[12px] text-faint sm:flex-row">
          <ForgeLogo />
          <span>Built with Next.js, Express, Prisma and WebContainers.</span>
        </div>
      </footer>
    </div>
  );
}
