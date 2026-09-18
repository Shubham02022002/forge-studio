"use client";

import { useState } from "react";
import {
  ExternalLink,
  MonitorPlay,
  RotateCw,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type Tab = "preview" | "code";

export function PreviewPane() {
  const [tab, setTab] = useState<Tab>("preview");

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-canvas">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-3">
        <div className="flex items-center gap-0.5 rounded-md border border-line bg-panel p-0.5">
          {(["preview", "code"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "inline-flex h-6 items-center gap-1.5 rounded-sm px-2.5 text-xs font-medium capitalize transition-colors",
                tab === t
                  ? "bg-elevated text-ink shadow-[inset_0_1px_0_oklch(1_0_0/6%)]"
                  : "text-faint hover:text-muted",
              )}
            >
              {t === "preview" ? (
                <MonitorPlay className="size-3.5" strokeWidth={1.9} />
              ) : (
                <Terminal className="size-3.5" strokeWidth={1.9} />
              )}
              {t}
            </button>
          ))}
        </div>

        <div className="mx-auto hidden min-w-0 max-w-md flex-1 items-center gap-2 rounded-md border border-line bg-panel px-2.5 py-1 sm:flex">
          <ShieldCheck className="size-3.5 shrink-0 text-faint" strokeWidth={1.9} />
          <span className="truncate font-mono text-[11px] text-faint">
            localhost:3000
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" title="Reload" aria-label="Reload">
            <RotateCw className="size-3.5" strokeWidth={1.9} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            title="Open in new tab"
            aria-label="Open in new tab"
          >
            <ExternalLink className="size-3.5" strokeWidth={1.9} />
          </Button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="grid-veil absolute inset-0 opacity-60" />
        <div className="absolute inset-0 grid place-items-center px-6">
          <div className="animate-rise w-full max-w-sm text-center">
            <div className="mx-auto grid size-11 place-items-center rounded-lg border border-line-strong bg-panel">
              <MonitorPlay className="size-5 text-faint" strokeWidth={1.7} />
            </div>
            <h2 className="mt-4 text-sm font-medium text-muted">
              Nothing running yet
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-faint">
              Describe your app in the chat and Forge will scaffold it into a
              sandboxed container with a live preview right here.
            </p>
          </div>
        </div>
      </div>

      <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-line bg-panel px-3 font-mono text-[11px] text-faint">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-faint" />
          sandbox idle
        </span>
        <span className="hidden sm:inline">node 22</span>
        <span className="ml-auto hidden sm:inline">crossOriginIsolated</span>
      </footer>
    </section>
  );
}
