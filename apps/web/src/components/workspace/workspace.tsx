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
    edit: editGeneration,
    hydrate: hydrateGeneration,
    files,
  } = generation;
  const {
    send: sendMessage,
    prompt,
    hydrateMessages,
    recordUser,
    recordAssistant,
  } = session;
  const { reset: resetSandbox, run: runSandbox } = sandbox;

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    getProject(projectId)
      .then((project) => {
        if (cancelled) return;
        const codeContents = project.messages
          .filter((m) => m.type === "code")
          .map((m) => m.content);

        hydrateMessages(project.messages);

        if (codeContents.length > 0) {
          hydrateGeneration(projectId, codeContents);
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
      if (files.length > 0) {
        recordUser(text);
        resetSandbox();
        setSelectedPath(null);
        setTab("code");

        try {
          const changed = await editGeneration(text, files);
          recordAssistant(
            changed.length > 0
              ? `Updated ${changed.join(", ")}`
              : "No files needed changing for that request.",
          );
        } catch (e) {
          recordAssistant(
            e instanceof Error ? e.message : "The change could not be applied.",
          );
        }
        return;
      }

      resetGeneration();
      resetSandbox();
      setSelectedPath(null);
      setTab("preview");
      await sendMessage(text);
    },
    [
      editGeneration,
      files,
      recordAssistant,
      recordUser,
      resetGeneration,
      resetSandbox,
      sendMessage,
    ],
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
