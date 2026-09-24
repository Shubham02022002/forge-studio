"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createProject,
  streamGeneration,
  type ProductBlueprint,
} from "@/lib/api";
import { parseArtifacts, type GeneratedFile } from "@/lib/artifacts";

export type GenerationPhase =
  | "idle"
  | "creating"
  | "streaming"
  | "done"
  | "error";

const PARSE_INTERVAL_MS = 80;
const MAX_TITLE = 120;
const MAX_DESCRIPTION = 500;
const MAX_PROMPT = 4000;

export function useGeneration() {
  const [phase, setPhase] = useState<GenerationPhase>("idle");
  const [status, setStatus] = useState<string | null>(null);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [shell, setShell] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [artifactTitle, setArtifactTitle] = useState<string | null>(null);
  const [receivedChars, setReceivedChars] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const rawRef = useRef("");
  const lastParseRef = useRef(0);

  const applyParse = useCallback((force: boolean) => {
    const now = performance.now();
    if (!force && now - lastParseRef.current < PARSE_INTERVAL_MS) return;
    lastParseRef.current = now;

    const parsed = parseArtifacts(rawRef.current);
    setFiles(parsed.files);
    setShell(parsed.shell);
    if (parsed.artifactTitle) setArtifactTitle(parsed.artifactTitle);
  }, []);

  const hydrate = useCallback((content: string) => {
    const parsed = parseArtifacts(content);
    setFiles(parsed.files);
    setShell(parsed.shell);
    if (parsed.artifactTitle) setArtifactTitle(parsed.artifactTitle);
    setPhase(parsed.files.length > 0 ? "done" : "idle");
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    rawRef.current = "";
    lastParseRef.current = 0;
    setPhase("idle");
    setStatus(null);
    setFiles([]);
    setShell([]);
    setError(null);
    setProjectId(null);
    setArtifactTitle(null);
    setReceivedChars(0);
  }, []);

  const start = useCallback(
    async (prompt: string, blueprint?: ProductBlueprint) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      rawRef.current = "";
      lastParseRef.current = 0;
      setFiles([]);
      setShell([]);
      setError(null);
      setStatus(null);
      setArtifactTitle(null);
      setReceivedChars(0);
      setPhase("creating");

      const safePrompt = prompt.slice(0, MAX_PROMPT);
      const title = (blueprint?.title ?? "Untitled app").slice(0, MAX_TITLE);
      const description = (blueprint?.description ?? prompt).slice(
        0,
        MAX_DESCRIPTION,
      );

      try {
        const project = await createProject({
          title,
          description,
          prompt: safePrompt,
        });
        setProjectId(project.id);
        setPhase("streaming");

        await streamGeneration(
          {
            projectId: project.id,
            prompt: safePrompt,
            ...(blueprint ? { blueprint } : {}),
          },
          {
            onStatus: (message) => setStatus(message),
            onChunk: (text) => {
              rawRef.current += text;
              setReceivedChars(rawRef.current.length);
              applyParse(false);
            },
            onDone: () => {
              applyParse(true);
              setPhase("done");
            },
            onError: (message) => {
              applyParse(true);
              setError(message);
              setPhase("error");
            },
          },
          controller.signal,
        );

        applyParse(true);
        setPhase((prev) => (prev === "error" ? prev : "done"));
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Generation failed.");
        setPhase("error");
      }
    },
    [applyParse],
  );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
    phase,
    status,
    files,
    shell,
    error,
    projectId,
    artifactTitle,
    receivedChars,
    start,
    hydrate,
    reset,
  };
}
