"use client";

import { Loader2, Mic, X } from "lucide-react";
import type { RecorderState } from "@/hooks/use-voice-recorder";
import { cn } from "@/lib/cn";

function formatDuration(seconds: number) {
  const total = Math.floor(seconds);
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}

const BAR_SCALE = [0.55, 1, 0.7, 0.85];

export function VoiceButton({
  state,
  duration,
  level,
  disabled,
  onStart,
  onStop,
  onCancel,
}: {
  state: RecorderState;
  duration: number;
  level: number;
  disabled: boolean;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
}) {
  const recording = state === "recording";
  const busy = state === "requesting" || state === "transcribing";

  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={() => (recording ? onStop() : onStart())}
      onContextMenu={(e) => {
        if (!recording) return;
        e.preventDefault();
        onCancel();
      }}
      title={recording ? "Release or click to send" : "Hold Space, or click to record"}
      className={cn(
        "ml-0.5 inline-flex h-7 items-center gap-1.5 rounded-sm border px-2 text-[11px] font-medium transition-colors",
        recording
          ? "border-danger/40 bg-danger/10 text-danger"
          : "border-line-strong text-muted hover:border-forge-line hover:bg-forge-soft hover:text-forge",
        (disabled || busy) && "pointer-events-none opacity-50",
      )}
    >
      {state === "requesting" && (
        <>
          <Loader2 className="size-3.5 animate-spin" strokeWidth={2.2} />
          Allow mic…
        </>
      )}

      {state === "transcribing" && (
        <>
          <Loader2 className="size-3.5 animate-spin" strokeWidth={2.2} />
          Transcribing…
        </>
      )}

      {recording && (
        <>
          <span className="size-1.5 animate-[forge-pulse_1.1s_ease-in-out_infinite] rounded-full bg-danger" />
          <span className="font-mono tabular-nums">
            {formatDuration(duration)}
          </span>
          <span className="flex h-3 items-end gap-[2px]" aria-hidden>
            {BAR_SCALE.map((scale, i) => (
              <span
                key={i}
                className="w-[2px] rounded-full bg-danger transition-[height] duration-75"
                style={{
                  height: `${Math.max(2, level * scale * 12)}px`,
                }}
              />
            ))}
          </span>
        </>
      )}

      {state === "idle" && (
        <>
          <Mic className="size-3.5" strokeWidth={2} />
          Hold Space
        </>
      )}
    </button>
  );
}

export function TranscriptStrip({
  raw,
  onDismiss,
}: {
  raw: string;
  onDismiss: () => void;
}) {
  return (
    <div className="animate-rise mb-2 flex items-start gap-2 rounded-md border border-line bg-panel px-2.5 py-2">
      <Mic className="mt-[2px] size-3 shrink-0 text-faint" strokeWidth={2} />
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[10px] uppercase tracking-wide text-faint">
          Heard
        </div>
        <p className="mt-0.5 line-clamp-3 text-[12px] leading-relaxed text-muted">
          {raw}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss transcript"
        className="mt-[1px] grid size-5 shrink-0 place-items-center rounded-sm text-faint transition-colors hover:bg-elevated hover:text-ink"
      >
        <X className="size-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}
