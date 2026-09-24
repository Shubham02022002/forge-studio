"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createProject,
  streamGeneration,
  type ProductBlueprint,
} from "@/lib/api";
import {
  mergeFiles,
  parseArtifacts,
  type GeneratedFile,
} from "@/lib/artifacts";

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
  const modeRef = useRef<"create" | "edit">("create");
  const baseFilesRef = useRef<GeneratedFile[]>([]);
  const projectIdRef = useRef<string | null>(null);

  const setProject = useCallback((id: string | null) => {
    projectIdRef.current = id;
    setProjectId(id);
  }, []);

  const applyParse = useCallback((force: boolean) => {
    const now = performance.now();
    if (!force && now - lastParseRef.current < PARSE_INTERVAL_MS) return;
    lastParseRef.current = now;

    const parsed = parseArtifacts(rawRef.current);
    setFiles(
      modeRef.current === "edit"
        ? mergeFiles(baseFilesRef.current, parsed.files)
        : parsed.files,
    );
    setShell(parsed.shell);
    if (parsed.artifactTitle) setArtifactTitle(parsed.artifactTitle);
  }, []);

  const hydrate = useCallback(
    (id: string, contents: string[]) => {
      let merged: GeneratedFile[] = [];
      let collectedShell: string[] = [];
      let title: string | null = null;

      for (const content of contents) {
        const parsed = parseArtifacts(content);
        merged = mergeFiles(merged, parsed.files);
        if (parsed.shell.length > 0) {
          collectedShell = [...collectedShell, ...parsed.shell];
        }
        if (parsed.artifactTitle) title = parsed.artifactTitle;
      }

      modeRef.current = "edit";
      baseFilesRef.current = merged;
      rawRef.current = "";
      lastParseRef.current = 0;
      setProject(id);
      setFiles(merged);
      setShell(collectedShell);
      if (title) setArtifactTitle(title);
      setPhase(merged.length > 0 ? "done" : "idle");
    },
    [setProject],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    rawRef.current = "";
    lastParseRef.current = 0;
    modeRef.current = "create";
    baseFilesRef.current = [];
    setPhase("idle");
    setStatus(null);
    setFiles([]);
    setShell([]);
    setError(null);
    setProject(null);
    setArtifactTitle(null);
    setReceivedChars(0);
  }, [setProject]);

  const start = useCallback(
    async (prompt: string, blueprint?: ProductBlueprint) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      modeRef.current = "create";
      baseFilesRef.current = [];
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
        setProject(project.id);
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
    [applyParse, setProject],
  );

  const edit = useCallback(
    async (
      instruction: string,
      current: GeneratedFile[],
    ): Promise<string[]> => {
      const id = projectIdRef.current;
      if (!id) throw new Error("This project is not ready to edit yet.");
      if (current.length === 0) {
        throw new Error("Generate the app before asking for changes.");
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const before = new Map(current.map((file) => [file.path, file.content]));

      modeRef.current = "edit";
      baseFilesRef.current = current;
      rawRef.current = "";
      lastParseRef.current = 0;
      setError(null);
      setStatus(null);
      setReceivedChars(0);
      setPhase("streaming");

      let streamError: string | null = null;

      try {
        await streamGeneration(
          {
            projectId: id,
            prompt: instruction.slice(0, MAX_PROMPT),
            mode: "edit",
            files: current.map(({ path, content }) => ({ path, content })),
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
              streamError = message;
              applyParse(true);
              setError(message);
              setPhase("error");
            },
          },
          controller.signal,
        );
      } catch (e) {
        if (controller.signal.aborted) return [];
        const message = e instanceof Error ? e.message : "The change failed.";
        setError(message);
        setPhase("error");
        throw new Error(message);
      }

      if (streamError) throw new Error(streamError);

      applyParse(true);
      setPhase("done");

      return mergeFiles(current, parseArtifacts(rawRef.current).files)
        .filter((file) => before.get(file.path) !== file.content)
        .map((file) => file.path);
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
    edit,
    hydrate,
    reset,
  };
}
