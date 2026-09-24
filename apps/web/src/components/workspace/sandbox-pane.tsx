"use client";

import { useEffect, useRef } from "react";
import {
  AlertTriangle,
  Loader2,
  Play,
  RotateCw,
  SquareTerminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GeneratedFile } from "@/lib/artifacts";
import type { SandboxPhase } from "@/hooks/use-sandbox";

const PHASE_LABEL: Record<SandboxPhase, string> = {
  idle: "Ready to run",
  booting: "Booting the sandbox…",
  mounting: "Mounting the project…",
  installing: "Installing dependencies…",
  starting: "Starting the dev server…",
  ready: "Running",
  error: "Sandbox failed",
};

const PHASE_DETAIL: Record<SandboxPhase, string> = {
  idle: "Runs entirely in your browser — nothing is sent to a server.",
  booting: "Starting a WebAssembly Node.js runtime.",
  mounting: "Writing the generated files into the virtual filesystem.",
  installing: "First run downloads packages. This takes a minute.",
  starting: "Vite is compiling the application.",
  ready: "The preview below is the real app, live.",
  error: "The preview could not start.",
};

function LogStream({ logs }: { logs: string[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [logs]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-line bg-canvas px-3 py-2">
      <div className="flex flex-col gap-0.5">
        {logs.map((line, index) => (
          <code
            key={index}
            className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted"
          >
            {line}
          </code>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

export function SandboxPane({
  files,
  phase,
  previewUrl,
  logs,
  error,
  onRun,
}: {
  files: GeneratedFile[];
  phase: SandboxPhase;
  previewUrl: string | null;
  logs: string[];
  error: string | null;
  onRun: () => void;
}) {
  const busy =
    phase === "booting" ||
    phase === "mounting" ||
    phase === "installing" ||
    phase === "starting";

  if (phase === "ready" && previewUrl) {
    return (
      <div className="relative h-full">
        <iframe
          src={previewUrl}
          title="Application preview"
          className="h-full w-full border-0 bg-white"
          allow="cross-origin-isolated"
        />
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div className="grid-veil absolute inset-0 opacity-60" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <div className="flex w-full max-w-md flex-col">
          {phase === "error" ? (
            <div className="text-center">
              <div className="mx-auto grid size-11 place-items-center rounded-lg border border-danger/30 bg-danger/10">
                <AlertTriangle className="size-5 text-danger" strokeWidth={1.8} />
              </div>
              <h2 className="mt-4 text-sm font-medium text-ink">
                Preview unavailable
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-faint">
                {error ?? "The sandbox failed to start."}
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-5"
                onClick={onRun}
              >
                <RotateCw className="size-3.5" strokeWidth={2} />
                Try again
              </Button>
            </div>
          ) : busy ? (
            <>
              <div className="flex items-center justify-center gap-2">
                <Loader2
                  className="size-4 shrink-0 animate-spin text-forge"
                  strokeWidth={2.2}
                />
                <h2 className="text-sm font-medium text-ink">
                  {PHASE_LABEL[phase]}
                </h2>
              </div>
              <p className="mt-1.5 text-center text-[13px] leading-relaxed text-faint">
                {PHASE_DETAIL[phase]}
              </p>
              <div className="mt-5 flex h-[220px] flex-col">
                <LogStream logs={logs} />
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto grid size-11 place-items-center rounded-lg border border-forge-line bg-forge-soft">
                <SquareTerminal
                  className="size-5 text-forge"
                  strokeWidth={1.7}
                />
              </div>
              <h2 className="mt-4 text-sm font-medium text-ink">
                Run this app
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-faint">
                {files.length} files are ready. Boot a sandboxed Node runtime in
                your browser and watch it come alive.
              </p>
              <Button
                variant="primary"
                size="sm"
                className="mt-5"
                onClick={onRun}
              >
                <Play className="size-3.5" strokeWidth={2.2} />
                Run the app
              </Button>
            </div>
          )}

          {logs.length > 0 && phase === "error" && (
            <div className="mt-5 flex h-[180px] flex-col">
              <LogStream logs={logs} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
