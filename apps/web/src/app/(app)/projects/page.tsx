"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, MessageSquare, Plus, RefreshCw } from "lucide-react";
import { AppRail } from "@/components/workspace/app-rail";
import { Button, buttonClass } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { getProjects, type ProjectSummary } from "@/lib/api";
import { timeAgo } from "@/lib/time";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; projects: ProjectSummary[] };

export default function ProjectsPage() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    getProjects()
      .then((projects) => {
        if (!cancelled) setState({ kind: "ready", projects });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            kind: "error",
            message:
              error instanceof Error ? error.message : "Something went wrong.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const reload = useCallback(() => {
    setState({ kind: "loading" });
    getProjects()
      .then((projects) => setState({ kind: "ready", projects }))
      .catch((error: unknown) =>
        setState({
          kind: "error",
          message:
            error instanceof Error ? error.message : "Something went wrong.",
        }),
      );
  }, []);

  return (
    <main className="flex h-dvh w-full overflow-hidden">
      <AppRail />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-5">
          <h1 className="text-[13px] font-medium text-ink">Projects</h1>
          {state.kind === "ready" && (
            <span className="text-[12px] text-faint">
              {state.projects.length}
            </span>
          )}
          <Link
            href="/workspace"
            className={buttonClass("primary", "sm", "ml-auto")}
          >
            <Plus className="size-3.5" strokeWidth={2.25} />
            New project
          </Link>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {state.kind === "loading" && (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[104px] animate-pulse rounded-lg border border-line bg-panel"
                />
              ))}
            </div>
          )}

          {state.kind === "error" && (
            <div className="mx-auto mt-16 max-w-sm text-center">
              <div className="mx-auto grid size-10 place-items-center rounded-lg border border-danger/30 bg-danger/10">
                <AlertTriangle className="size-4 text-danger" strokeWidth={1.9} />
              </div>
              <h2 className="mt-4 text-sm font-medium text-ink">
                Can&apos;t load projects
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-faint">
                {state.message}
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-5"
                onClick={reload}
              >
                <RefreshCw className="size-3.5" strokeWidth={2} />
                Try again
              </Button>
            </div>
          )}

          {state.kind === "ready" && state.projects.length === 0 && (
            <div className="mx-auto mt-16 max-w-sm text-center">
              <div className="mx-auto grid size-10 place-items-center rounded-lg border border-line-strong bg-panel">
                <MessageSquare className="size-4 text-faint" strokeWidth={1.9} />
              </div>
              <h2 className="mt-4 text-sm font-medium text-ink">
                No projects yet
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-faint">
                Describe an app and Forge will scaffold it into a sandbox with a
                live preview.
              </p>
              <Link
                href="/workspace"
                className={buttonClass("primary", "sm", "mt-5")}
              >
                Start building
              </Link>
            </div>
          )}

          {state.kind === "ready" && state.projects.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {state.projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/workspace?project=${p.id}`}
                  className="group flex flex-col rounded-lg border border-line bg-panel p-4 transition-colors hover:border-line-strong hover:bg-elevated"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="truncate text-[13px] font-medium text-ink">
                      {p.title}
                    </h2>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-faint">
                    {p.description || "No description yet."}
                  </p>
                  <div className="mt-auto flex items-center gap-3 pt-4 font-mono text-[11px] text-faint">
                    <span className="inline-flex items-center gap-1.5">
                      <MessageSquare className="size-3" strokeWidth={2} />
                      {p._count.messages}
                    </span>
                    <span className="ml-auto">{timeAgo(p.updatedAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
