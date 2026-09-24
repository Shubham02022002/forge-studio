"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppRail } from "@/components/workspace/app-rail";
import { ChatPane } from "@/components/workspace/chat-pane";
import {
  PreviewPane,
  type PreviewTab,
} from "@/components/workspace/preview-pane";
import { useBuildSession } from "@/hooks/use-build-session";
import { useGeneration } from "@/hooks/use-generation";
import { useSandbox } from "@/hooks/use-sandbox";
import {
  getProject,
  type ProductBlueprint,
} from "@/lib/api";

export function Workspace() {
  const session = useBuildSession();
  const generation = useGeneration();
  const sandbox = useSandbox();
  const [tab, setTab] = useState<PreviewTab>("preview");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  const {
    reset: resetGeneration,
    start: startGeneration,
    hydrate: hydrateGeneration,
    files,
  } = generation;
  const { send: sendMessage, prompt, hydrateMessages } = session;
  const { reset: resetSandbox, run: runSandbox } = sandbox;

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    getProject(projectId)
      .then((project) => {
        if (cancelled) return;
        const codeMessage = project.messages.find((m) => m.type === "code");
        hydrateMessages(project.messages);
        if (codeMessage?.content) {
          hydrateGeneration(codeMessage.content);
          setTab("code");
        }
      })
      .catch(() => {
        if (!cancelled) setTab("code");
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, hydrateGeneration, hydrateMessages]);

  const send = useCallback(
    async (text: string) => {
      resetGeneration();
      resetSandbox();
      setSelectedPath(null);
      setTab("preview");
      await sendMessage(text);
    },
    [resetGeneration, resetSandbox, sendMessage],
  );

  const generate = useCallback(
    (blueprint: ProductBlueprint) => {
      resetSandbox();
      setTab("code");
      void startGeneration(prompt.trim() || blueprint.description, blueprint);
    },
    [prompt, resetSandbox, startGeneration],
  );

  const run = useCallback(() => {
    setTab("preview");
    void runSandbox(files);
  }, [files, runSandbox]);

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
        sandbox={sandbox}
        selectedPath={selectedPath}
        onSelect={setSelectedPath}
        onRun={run}
      />
    </main>
  );
}
