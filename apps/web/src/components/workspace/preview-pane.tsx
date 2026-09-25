"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Check,
  Download,
  ExternalLink,
  Loader2,
  MonitorPlay,
  RotateCw,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeView } from "@/components/workspace/code-view";
import { FileTree } from "@/components/workspace/file-tree";
import { SandboxPane } from "@/components/workspace/sandbox-pane";
import type { useGeneration } from "@/hooks/use-generation";
import type { SandboxPhase, useSandbox } from "@/hooks/use-sandbox";
import { exportProject } from "@/lib/api";
import { buildTree } from "@/lib/artifacts";
import { cn } from "@/lib/cn";

export type PreviewTab = "preview" | "code";

const PREVIEW_STATUS: Record<SandboxPhase, string> = {
  idle: "sandbox idle",
  booting: "booting sandbox",
  mounting: "mounting files",
  installing: "installing packages",
  starting: "starting dev server",
  ready: "app running",
  error: "sandbox failed",
};

export function PreviewPane({
  tab,
  onTabChange,
  generation,
  sandbox,
  selectedPath,
  onSelect,
  onRun,
}: {
  tab: PreviewTab;
  onTabChange: (tab: PreviewTab) => void;
  generation: ReturnType<typeof useGeneration>;
  sandbox: ReturnType<typeof useSandbox>;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onRun: () => void;
}) {
  const { phase, status, files, error, receivedChars, projectId } = generation;

  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const onExport = useCallback(async () => {
    if (!projectId) return;
    setExporting(true);
    setExportError(null);

    try {
      await exportProject(projectId);
      setExported(true);
      setTimeout(() => setExported(false), 2400);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }, [projectId]);

  const tree = useMemo(() => buildTree(files), [files]);
  const selected =
    files.find((file) => file.path === selectedPath) ??
    files.find((file) => file.complete) ??
    files[0] ??
    null;
  const streamingPath = files.find((file) => !file.complete)?.path ?? null;

  const active = phase === "creating" || phase === "streaming";
  const hasFiles = files.length > 0;

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-canvas">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-3">
        <div className="flex items-center gap-0.5 rounded-md border border-line bg-panel p-0.5">
          {(["preview", "code"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTabChange(t)}
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
              {t === "code" && hasFiles && (
                <span className="ml-0.5 font-mono text-[10px] text-faint">
                  {files.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {active && (
          <div className="flex min-w-0 items-center gap-2 text-[11px] text-forge">
            <Loader2 className="size-3.5 shrink-0 animate-spin" strokeWidth={2.2} />
            <span className="truncate">{status ?? "Starting…"}</span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 px-2 text-xs"
            title="Download the project as a ZIP"
            disabled={!hasFiles || !projectId || exporting}
            onClick={() => void onExport()}
          >
            {exporting ? (
              <Loader2 className="size-3.5 animate-spin" strokeWidth={2.1} />
            ) : exported ? (
              <Check className="size-3.5 text-success" strokeWidth={2.1} />
            ) : (
              <Download className="size-3.5" strokeWidth={1.9} />
            )}
            {exported ? "Saved" : "Export"}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            title="Reload preview"
            aria-label="Reload preview"
            disabled={!hasFiles || sandbox.busy}
            onClick={onRun}
          >
            <RotateCw className="size-3.5" strokeWidth={1.9} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            title="Open in new tab"
            aria-label="Open in new tab"
            disabled={!sandbox.previewUrl}
            onClick={() => {
              if (sandbox.previewUrl) {
                window.open(sandbox.previewUrl, "_blank", "noopener");
              }
            }}
          >
            <ExternalLink className="size-3.5" strokeWidth={1.9} />
          </Button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {tab === "code" ? (
          hasFiles ? (
            <div className="flex h-full">
              <div className="w-[210px] shrink-0 overflow-y-auto border-r border-line bg-panel/40">
                <FileTree
                  nodes={tree}
                  selectedPath={selected?.path ?? null}
                  streamingPath={streamingPath}
                  onSelect={onSelect}
                />
              </div>
              <div className="min-w-0 flex-1">
                <CodeView file={selected} />
              </div>
            </div>
          ) : (
            <div className="grid h-full place-items-center px-6">
              <div className="w-full max-w-sm text-center">
                {active ? (
                  <>
                    <Loader2
                      className="mx-auto size-5 animate-spin text-forge"
                      strokeWidth={2}
                    />
                    <h2 className="mt-4 text-sm font-medium text-muted">
                      Writing the codebase
                    </h2>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-faint">
                      {receivedChars.toLocaleString()} characters received. Files
                      appear here as each one finishes.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mx-auto grid size-11 place-items-center rounded-lg border border-line-strong bg-panel">
                      <Terminal className="size-5 text-faint" strokeWidth={1.7} />
                    </div>
                    <h2 className="mt-4 text-sm font-medium text-muted">
                      No files yet
                    </h2>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-faint">
                      Finish the spec in the chat, then generate the codebase.
                    </p>
                  </>
                )}
              </div>
            </div>
          )
        ) : hasFiles ? (
          <SandboxPane
            files={files}
            phase={sandbox.phase}
            previewUrl={sandbox.previewUrl}
            logs={sandbox.logs}
            error={sandbox.error}
            onRun={onRun}
          />
        ) : (
          <div className="relative h-full">
            <div className="grid-veil absolute inset-0 opacity-60" />
            <div className="absolute inset-0 grid place-items-center px-6">
              <div className="w-full max-w-sm text-center">
                <div className="mx-auto grid size-11 place-items-center rounded-lg border border-line-strong bg-panel">
                  <MonitorPlay className="size-5 text-faint" strokeWidth={1.7} />
                </div>
                <h2 className="mt-4 text-sm font-medium text-muted">
                  Nothing running yet
                </h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-faint">
                  Describe your app in the chat and Forge will scaffold it into
                  a sandboxed container with a live preview right here.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-line bg-panel px-3 font-mono text-[11px] text-faint">
        <span
          className={cn(
            "inline-flex items-center gap-1.5",
            (error || sandbox.error) && "text-danger",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              error || sandbox.error
                ? "bg-danger"
                : active || sandbox.busy
                  ? "bg-forge animate-[forge-pulse_1.4s_ease-in-out_infinite]"
                  : sandbox.phase === "ready" || phase === "done"
                    ? "bg-success"
                    : "bg-faint",
            )}
          />
          {error
            ? "generation failed"
            : active
              ? "generating"
              : hasFiles
                ? PREVIEW_STATUS[sandbox.phase]
                : phase === "done"
                  ? "generated"
                  : "sandbox idle"}
        </span>
        {hasFiles && <span>{files.length} files</span>}
        <span className="ml-auto hidden sm:inline">
          {sandbox.isolated ? "crossOriginIsolated" : "isolation unavailable"}
        </span>
      </footer>

      {(error || exportError) && (
        <div className="shrink-0 border-t border-danger/30 bg-danger/10 px-3 py-2">
          <p className="text-[12px] leading-relaxed text-danger">
            {error ?? exportError}
          </p>
        </div>
      )}

      {!error && generation.shell.length > 0 && phase === "done" && (
        <div className="shrink-0 border-t border-line px-3 py-2">
          <div className="font-mono text-[10px] uppercase tracking-wide text-faint">
            Shell
          </div>
          <div className="mt-1 flex flex-col gap-0.5">
            {generation.shell.map((command, index) => (
              <code
                key={index}
                className="whitespace-pre-wrap font-mono text-[11px] text-muted"
              >
                $ {command}
              </code>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
