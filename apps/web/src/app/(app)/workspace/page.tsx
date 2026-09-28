import { Suspense } from "react";
import type { Metadata } from "next";
import { Workspace } from "@/components/workspace/workspace";

export const metadata: Metadata = {
  title: "Workspace",
};

function WorkspaceFallback() {
  return (
    <main className="flex h-dvh w-full overflow-hidden">
      <div className="w-[52px] shrink-0 border-r border-line bg-panel" />
      <div className="flex w-[404px] shrink-0 flex-col border-r border-line bg-canvas">
        <div className="h-12 shrink-0 border-b border-line" />
        <div className="flex-1 p-4">
          <div className="h-24 animate-pulse rounded-lg border border-line bg-panel" />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col bg-canvas">
        <div className="h-12 shrink-0 border-b border-line" />
        <div className="grid flex-1 place-items-center">
          <p className="text-[13px] text-faint">Loading workspace…</p>
        </div>
      </div>
    </main>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<WorkspaceFallback />}>
      <Workspace />
    </Suspense>
  );
}
