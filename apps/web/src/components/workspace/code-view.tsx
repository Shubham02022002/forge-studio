"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { GeneratedFile } from "@/lib/artifacts";
import { cn } from "@/lib/cn";

export function CodeView({ file }: { file: GeneratedFile | null }) {
  const [copied, setCopied] = useState(false);

  if (!file) {
    return (
      <div className="grid h-full place-items-center px-6">
        <p className="text-center text-[12px] text-faint">
          Select a file to view its contents.
        </p>
      </div>
    );
  }

  const lines = file.content.split("\n");

  const copy = () => {
    void navigator.clipboard
      .writeText(file.content)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      })
      .catch(() => setCopied(false));
  };

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-line px-3">
        <span className="truncate font-mono text-[11px] text-muted">
          {file.path}
        </span>
        {!file.complete && (
          <span className="shrink-0 rounded-full border border-forge-line bg-forge-soft px-1.5 py-0.5 text-[10px] font-medium text-forge">
            writing
          </span>
        )}
        <button
          type="button"
          onClick={copy}
          title="Copy file"
          aria-label="Copy file"
          className="ml-auto grid size-6 shrink-0 place-items-center rounded-sm text-faint transition-colors hover:bg-elevated hover:text-ink"
        >
          {copied ? (
            <Check className="size-3.5 text-success" strokeWidth={2.4} />
          ) : (
            <Copy className="size-3.5" strokeWidth={1.9} />
          )}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <pre className="min-w-full py-3 font-mono text-[11.5px] leading-[1.65]">
          {lines.map((line, index) => (
            <div key={index} className="flex">
              <span
                className={cn(
                  "sticky left-0 w-11 shrink-0 select-none bg-canvas pr-3 text-right text-faint tabular-nums",
                )}
              >
                {index + 1}
              </span>
              <code className="whitespace-pre pr-6 text-ink">
                {line === "" ? " " : line}
              </code>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
