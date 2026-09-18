"use client";

import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ClarificationQuestion } from "@/lib/api";
import { cn } from "@/lib/cn";

const OTHER = "__other__";

const categoryLabels: Record<ClarificationQuestion["category"], string> = {
  features: "Features",
  auth: "Auth",
  database: "Data",
  design: "Design",
};

export function ClarificationCard({
  score,
  questions,
  busy,
  onSubmit,
}: {
  score: number;
  questions: ClarificationQuestion[];
  busy: boolean;
  onSubmit: (answers: Record<string, string>) => void;
}) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [custom, setCustom] = useState<Record<string, string>>({});

  const answers = useMemo(() => {
    const out: Record<string, string> = {};
    for (const q of questions) {
      const pick = selected[q.id];
      const value = pick === OTHER ? custom[q.id]?.trim() : pick;
      if (value) out[q.question] = value;
    }
    return out;
  }, [questions, selected, custom]);

  const complete = Object.keys(answers).length === questions.length;

  return (
    <div className="animate-rise rounded-lg border border-line-strong bg-panel">
      <div className="border-b border-line px-3.5 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[13px] font-medium text-ink">
            {questions.length === 1 ? "One question" : `${questions.length} questions`}
          </h3>
          <span
            className={cn(
              "font-mono text-[11px]",
              score >= 80 ? "text-success" : score >= 50 ? "text-forge" : "text-faint",
            )}
          >
            {score}% complete
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-line-strong">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500 ease-out",
              score >= 80 ? "bg-success" : score >= 50 ? "bg-forge" : "bg-faint",
            )}
            style={{ width: `${Math.max(4, Math.min(100, score))}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col divide-y divide-line">
        {questions.map((q) => {
          const pick = selected[q.id];
          const showCustom =
            q.allowCustomInput !== false &&
            (pick === OTHER || q.options.length === 0);

          return (
            <fieldset key={q.id} className="px-3.5 py-3">
              <legend className="mb-2 flex items-center gap-2">
                <span className="rounded-sm bg-elevated px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-faint">
                  {categoryLabels[q.category] ?? q.category}
                </span>
              </legend>

              <p className="text-[13px] leading-relaxed text-muted">
                {q.question}
              </p>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {q.options.map((option, index) => {
                  const active = pick === option;
                  return (
                    <button
                      key={index}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setSelected((prev) => ({ ...prev, [q.id]: option }))
                      }
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-left text-[12px] transition-colors",
                        active
                          ? "border-forge-line bg-forge-soft text-forge"
                          : "border-line-strong text-muted hover:border-line-strong hover:bg-elevated hover:text-ink",
                      )}
                    >
                      {option}
                    </button>
                  );
                })}

                {q.allowCustomInput !== false && (
                  <button
                    type="button"
                    aria-pressed={pick === OTHER}
                    onClick={() => setSelected((prev) => ({ ...prev, [q.id]: OTHER }))}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[12px] transition-colors",
                      pick === OTHER
                        ? "border-forge-line bg-forge-soft text-forge"
                        : "border-line-strong text-faint hover:bg-elevated hover:text-muted",
                    )}
                  >
                    Other
                  </button>
                )}
              </div>

              {showCustom && (
                <input
                  autoFocus
                  value={custom[q.id] ?? ""}
                  onChange={(e) =>
                    setCustom((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                  placeholder="Type your answer…"
                  className="mt-2.5 w-full rounded-md border border-line-strong bg-canvas px-2.5 py-1.5 text-[12px] text-ink outline-none transition-colors placeholder:text-faint focus:border-forge-line"
                />
              )}
            </fieldset>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-3.5 py-2.5">
        <span className="text-[11px] text-faint">
          {complete
            ? "Forge has what it needs."
            : `${questions.length - Object.keys(answers).length} left to answer`}
        </span>
        <Button
          variant="primary"
          size="sm"
          disabled={!complete || busy}
          onClick={() => onSubmit(answers)}
        >
          Continue
          <ArrowRight className="size-3.5" strokeWidth={2.25} />
        </Button>
      </div>
    </div>
  );
}
