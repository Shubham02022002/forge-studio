"use client";

import { useCallback, useState } from "react";
import { AppRail } from "@/components/workspace/app-rail";
import { ChatPane } from "@/components/workspace/chat-pane";
import {
  PreviewPane,
  type PreviewTab,
} from "@/components/workspace/preview-pane";
import { useBuildSession } from "@/hooks/use-build-session";
import { useGeneration } from "@/hooks/use-generation";
import type { ProductBlueprint } from "@/lib/api";

export function Workspace() {
  const session = useBuildSession();
  const generation = useGeneration();
  const [tab, setTab] = useState<PreviewTab>("preview");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const { reset: resetGeneration, start: startGeneration } = generation;
  const { send: sendMessage, prompt } = session;

  const send = useCallback(
    async (text: string) => {
      resetGeneration();
      setSelectedPath(null);
      setTab("preview");
      await sendMessage(text);
    },
    [resetGeneration, sendMessage],
  );

  const generate = useCallback(
    (blueprint: ProductBlueprint) => {
      setTab("code");
      void startGeneration(prompt.trim() || blueprint.description, blueprint);
    },
    [prompt, startGeneration],
  );

  const generating =
    generation.phase === "creating" || generation.phase === "streaming";

  return (
    <main className="flex h-dvh w-full overflow-hidden">
      <AppRail />
      <ChatPane
        session={{ ...session, send }}
        generating={generating}
        generated={generation.phase === "done"}
        onGenerate={generate}
        onBrowseCode={() => setTab("code")}
      />
      <PreviewPane
        tab={tab}
        onTabChange={setTab}
        generation={generation}
        selectedPath={selectedPath}
        onSelect={setSelectedPath}
      />
    </main>
  );
}
