"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Paperclip, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClarificationCard } from "@/components/workspace/clarification-card";
import { MessageList } from "@/components/workspace/message-list";
import { TranscriptStrip, VoiceButton } from "@/components/workspace/voice-input";
import type { useBuildSession } from "@/hooks/use-build-session";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import type { ProductBlueprint, VoiceTranscriptionResult } from "@/lib/api";
import { cn } from "@/lib/cn";

const starters = [
  {
    title: "Habit tracker",
    body: "Daily habits with streaks, weekly review emails and a calendar heatmap.",
  },
  {
    title: "Revenue dashboard",
    body: "Stripe revenue with MRR, churn and cohort retention charts.",
  },
  {
    title: "Local marketplace",
    body: "Farm produce marketplace with seller onboarding and Stripe Connect payouts.",
  },
  {
    title: "Realtime kanban",
    body: "Kanban board with multiplayer cursors, comments and drag-and-drop.",
  },
];

function isTextField(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return (
    el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable
  );
}

export function ChatPane({
  session,
  generating,
  generated,
  onGenerate,
  onBrowseCode,
}: {
  session: ReturnType<typeof useBuildSession>;
  generating: boolean;
  generated: boolean;
  onGenerate: (blueprint: ProductBlueprint) => void;
  onBrowseCode: () => void;
}) {
  const [value, setValue] = useState("");
  const [heard, setHeard] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { messages, active, busy, error, send, answer } = session;

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  const handleTranscript = useCallback(
    (result: VoiceTranscriptionResult) => {
      setHeard(result.rawTranscript);
      setValue(result.refinedPrompt);
      requestAnimationFrame(resize);
      textareaRef.current?.focus();
    },
    [resize],
  );

  const {
    state: voiceState,
    duration: voiceDuration,
    level: voiceLevel,
    error: voiceError,
    start: startVoice,
    stop: stopVoice,
    cancel: cancelVoice,
  } = useVoiceRecorder(handleTranscript);

  const awaitingAnswers = active !== null;
  const locked = busy || awaitingAnswers || generating;
  const showEmptyState = messages.length === 0 && !busy && !error;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTextField(event.target)) return;
      event.preventDefault();
      if (!locked && voiceState === "idle") void startVoice();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      if (voiceState === "recording") stopVoice();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [locked, startVoice, stopVoice, voiceState]);

  const blueprintMessage = messages.find((m) => "blueprint" in m);
  const title =
    blueprintMessage && "blueprint" in blueprintMessage
      ? blueprintMessage.blueprint.title
      : "New project";
  const status = blueprintMessage
    ? "Spec ready"
    : messages.length > 0
      ? "Building"
      : "Draft";

  const submit = useCallback(() => {
    const text = value.trim();
    if (!text || locked || voiceState !== "idle") return;
    setValue("");
    setHeard(null);
    requestAnimationFrame(resize);
    void send(text);
  }, [locked, resize, send, value, voiceState]);

  return (
    <section className="flex w-[404px] shrink-0 flex-col border-r border-line bg-canvas">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3">
        <h1 className="truncate text-[13px] font-medium text-ink">{title}</h1>
        <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line-strong px-2 py-0.5 text-[11px] text-faint">
          <span
            className={cn(
              "size-1.5 rounded-full",
              blueprintMessage
                ? "bg-success"
                : messages.length > 0
                  ? "bg-forge animate-[forge-pulse_1.6s_ease-in-out_infinite]"
                  : "bg-faint",
            )}
          />
          {status}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {showEmptyState ? (
          <div className="flex h-full flex-col justify-center px-5 pb-4">
            <div className="animate-rise">
              <div className="mb-1.5 grid size-8 place-items-center rounded-md border border-forge-line bg-forge-soft">
                <Sparkles className="size-4 text-forge" strokeWidth={1.9} />
              </div>
              <h2 className="text-balance-tight text-lg font-semibold text-ink">
                What do you want to build?
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-faint">
                Describe it out loud or type it. Forge asks the questions that
                make the spec complete before writing a line of code.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-1.5">
              {starters.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => {
                    setValue(s.body);
                    textareaRef.current?.focus();
                  }}
                  style={{ animationDelay: `${60 + i * 45}ms` }}
                  className="animate-rise group rounded-md border border-line px-3 py-2.5 text-left transition-colors hover:border-line-strong hover:bg-panel"
                >
                  <div className="text-[13px] font-medium text-muted transition-colors group-hover:text-ink">
                    {s.title}
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-faint">
                    {s.body}
                  </div>
                </button>
              ))}
            </div>

            <p className="mt-5 flex items-center gap-1.5 text-[12px] text-faint">
              Hold
              <kbd className="rounded border border-line-strong px-1.5 py-0.5 font-mono text-[10px] text-muted">
                Space
              </kbd>
              anywhere to speak instead.
            </p>
          </div>
        ) : (
          <>
            <MessageList
              messages={messages}
              busy={busy}
              error={error}
              generating={generating}
              generated={generated}
              onGenerate={onGenerate}
              onBrowseCode={onBrowseCode}
            />
            {active && (
              <div className="px-4 pb-5">
                <ClarificationCard
                  score={active.score}
                  questions={active.questions}
                  busy={busy}
                  onSubmit={(answers) => void answer(answers)}
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className="shrink-0 px-3 pb-3">
        {heard && <TranscriptStrip raw={heard} onDismiss={() => setHeard(null)} />}

        {voiceError && (
          <div className="animate-rise mb-2 rounded-md border border-danger/30 bg-danger/10 px-2.5 py-2">
            <p className="text-[12px] leading-relaxed text-danger">
              {voiceError}
            </p>
          </div>
        )}

        <div
          className={cn(
            "rounded-lg border bg-panel transition-shadow duration-200",
            voiceState === "recording"
              ? "border-danger/40 shadow-[0_0_0_1px_oklch(0.66_0.2_25/25%)]"
              : "border-line-strong focus-within:border-forge-line focus-within:shadow-glow",
            locked && "opacity-60",
          )}
        >
          <textarea
            ref={textareaRef}
            value={value}
            disabled={locked}
            onChange={(e) => {
              setValue(e.target.value);
              resize();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder={
              awaitingAnswers
                ? "Answer the questions above to continue"
                : locked
                  ? "Working…"
                  : generated
                    ? "Describe a change — “make the header sticky”, “add a search filter”…"
                    : "Describe the app you want to build, or hold Space to speak…"
            }
            spellCheck={false}
            className="block max-h-[200px] w-full resize-none bg-transparent px-3.5 pt-3 pb-1 text-[13px] leading-relaxed text-ink outline-none placeholder:text-faint disabled:cursor-not-allowed"
          />

          <div className="flex items-center gap-1 px-2 pb-2">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={locked}
              title="Attach files"
              aria-label="Attach files"
            >
              <Paperclip className="size-3.5" strokeWidth={1.9} />
            </Button>

            <VoiceButton
              state={voiceState}
              duration={voiceDuration}
              level={voiceLevel}
              disabled={locked}
              onStart={() => void startVoice()}
              onStop={stopVoice}
              onCancel={cancelVoice}
            />

            <Button
              variant="primary"
              size="icon-sm"
              className="ml-auto"
              disabled={!value.trim() || locked || voiceState !== "idle"}
              onClick={submit}
              aria-label="Send"
              title="Send"
            >
              <ArrowUp className="size-4" strokeWidth={2.5} />
            </Button>
          </div>
        </div>

        <p className="mt-2 px-0.5 text-[11px] text-faint">
          {voiceState === "recording"
            ? "Release Space to transcribe. Right-click to cancel."
            : generated
              ? "Follow-ups edit the app in place — only the files that change are rewritten."
              : "Forge may ask follow-up questions before building."}
        </p>
      </div>
    </section>
  );
}
