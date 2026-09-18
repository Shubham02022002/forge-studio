"use client";

import { useCallback, useRef, useState } from "react";
import { ArrowUp, AudioLines, Paperclip, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function ChatPane() {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const showEmptyState = value.trim().length === 0;

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  const submit = useCallback(() => {
    setValue("");
    requestAnimationFrame(resize);
  }, [resize]);

  return (
    <section className="flex w-[404px] shrink-0 flex-col border-r border-line bg-canvas">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3">
        <h1 className="truncate text-[13px] font-medium text-ink">New project</h1>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-2 py-0.5 text-[11px] text-faint">
          <span className="size-1.5 rounded-full bg-faint" />
          Draft
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
          </div>
        ) : (
          <div className="px-4 py-5" />
        )}
      </div>

      <div className="shrink-0 px-3 pb-3">
        <div
          className={cn(
            "rounded-lg border border-line-strong bg-panel transition-shadow duration-200",
            "focus-within:border-forge-line focus-within:shadow-glow",
          )}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              resize();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (value.trim()) submit();
              }
            }}
            rows={1}
            placeholder="Describe the app you want to build…"
            spellCheck={false}
            className="block max-h-[200px] w-full resize-none bg-transparent px-3.5 pt-3 pb-1 text-[13px] leading-relaxed text-ink outline-none placeholder:text-faint"
          />

          <div className="flex items-center gap-1 px-2 pb-2">
            <Button
              variant="ghost"
              size="icon-sm"
              title="Attach files"
              aria-label="Attach files"
            >
              <Paperclip className="size-3.5" strokeWidth={1.9} />
            </Button>

            <button
              type="button"
              className="ml-0.5 inline-flex h-7 items-center gap-1.5 rounded-sm border border-line-strong px-2 text-[11px] font-medium text-muted transition-colors hover:border-forge-line hover:bg-forge-soft hover:text-forge"
            >
              <AudioLines className="size-3.5" strokeWidth={2} />
              Hold Space
            </button>

            <Button
              variant="primary"
              size="icon-sm"
              className="ml-auto"
              disabled={!value.trim()}
              onClick={submit}
              aria-label="Send"
              title="Send"
            >
              <ArrowUp className="size-4" strokeWidth={2.5} />
            </Button>
          </div>
        </div>

        <p className="mt-2 px-0.5 text-[11px] text-faint">
          Forge may ask follow-up questions before building.
        </p>
      </div>
    </section>
  );
}
