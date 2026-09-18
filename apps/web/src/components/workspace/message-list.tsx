"use client";

import { useEffect, useRef } from "react";
import { BlueprintCard } from "@/components/workspace/blueprint-card";
import { ForgeMark } from "@/components/ui/forge-mark";
import type { BuildMessage } from "@/hooks/use-build-session";
import type { ProductBlueprint } from "@/lib/api";

function BusyRow() {
  return (
    <div className="flex items-center gap-2">
      <ForgeMark className="size-3.5 animate-[forge-pulse_1.4s_ease-in-out_infinite]" />
      <span className="text-[13px] text-faint">
        Thinking through your spec…
      </span>
    </div>
  );
}

export function MessageList({
  messages,
  busy,
  error,
  generating,
  generated,
  onGenerate,
  onBrowseCode,
}: {
  messages: BuildMessage[];
  busy: boolean;
  error: string | null;
  generating: boolean;
  generated: boolean;
  onGenerate: (blueprint: ProductBlueprint) => void;
  onBrowseCode: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy, error]);

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      {messages.map((m) =>
        m.role === "user" ? (
          <div key={m.id} className="flex justify-end">
            <p className="animate-rise max-w-[85%] rounded-lg rounded-br-sm border border-line-strong bg-elevated px-3 py-2 text-[13px] leading-relaxed text-ink">
              {m.text}
            </p>
          </div>
        ) : "blueprint" in m ? (
          <BlueprintCard
            key={m.id}
            blueprint={m.blueprint}
            generating={generating}
            generated={generated}
            onGenerate={onGenerate}
            onBrowseCode={onBrowseCode}
          />
        ) : (
          <p
            key={m.id}
            className="animate-rise text-[13px] leading-relaxed text-muted"
          >
            {m.text}
          </p>
        ),
      )}

      {busy && <BusyRow />}

      {error && (
        <div className="animate-rise rounded-md border border-danger/30 bg-danger/10 px-3 py-2.5">
          <p className="text-[12px] leading-relaxed text-danger">{error}</p>
          <p className="mt-1 text-[11px] text-faint">
            Check that the Forge API is running on port 5000.
          </p>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
