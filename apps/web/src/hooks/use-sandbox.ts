"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { WebContainerProcess } from "@webcontainer/api";
import type { GeneratedFile } from "@/lib/artifacts";
import {
  findMissingScaffold,
  getWebContainer,
  isSandboxSupported,
  toFileSystemTree,
} from "@/lib/sandbox";

export type SandboxPhase =
  | "idle"
  | "booting"
  | "mounting"
  | "installing"
  | "starting"
  | "ready"
  | "error";

const MAX_LOG_LINES = 300;

function subscribeToIsolation() {
  return () => {};
}

export function useSandbox() {
  const [phase, setPhase] = useState<SandboxPhase>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runIdRef = useRef(0);
  const devProcessRef = useRef<WebContainerProcess | null>(null);
  const listenerAttachedRef = useRef(false);

  const appendLog = useCallback((chunk: string) => {
    const lines = chunk.split("\n").filter((line) => line.trim() !== "");
    if (lines.length === 0) return;

    setLogs((previous) => {
      const next = [...previous, ...lines];
      return next.length > MAX_LOG_LINES ? next.slice(-MAX_LOG_LINES) : next;
    });
  }, []);

  const pipe = useCallback(
    (process: WebContainerProcess, alive: () => boolean) => {
      process.output.pipeTo(
        new WritableStream({
          write(chunk) {
            if (alive()) appendLog(chunk);
          },
        }),
      );
    },
    [appendLog],
  );

  const run = useCallback(
    async (files: GeneratedFile[]) => {
      const runId = runIdRef.current + 1;
      runIdRef.current = runId;
      const alive = () => runIdRef.current === runId;

      setError(null);
      setPreviewUrl(null);
      setLogs([]);

      if (!isSandboxSupported()) {
        setError(
          "This page is not cross-origin isolated, so the sandbox cannot start. Reload the page and try again.",
        );
        setPhase("error");
        return;
      }

      const missing = findMissingScaffold(files);
      if (missing.length > 0) {
        setError(
          `The generated project is missing required files: ${missing.join(", ")}.`,
        );
        setPhase("error");
        return;
      }

      try {
        setPhase("booting");
        const container = await getWebContainer();
        if (!alive()) return;

        if (!listenerAttachedRef.current) {
          listenerAttachedRef.current = true;
          container.on("server-ready", (_port, url) => {
            setPreviewUrl(url);
            setPhase("ready");
          });
        }

        if (devProcessRef.current) {
          devProcessRef.current.kill();
          devProcessRef.current = null;
        }

        setPhase("mounting");
        await container.mount(toFileSystemTree(files));
        if (!alive()) return;

        setPhase("installing");
        const install = await container.spawn("npm", ["install"]);
        pipe(install, alive);
        const installExit = await install.exit;
        if (!alive()) return;

        if (installExit !== 0) {
          throw new Error(
            `npm install exited with code ${installExit}. See the log for details.`,
          );
        }

        setPhase("starting");
        const dev = await container.spawn("npm", ["run", "dev"]);
        devProcessRef.current = dev;
        pipe(dev, alive);

        void dev.exit.then((code) => {
          if (!alive()) return;
          if (code !== 0) {
            setError(`The dev server exited with code ${code}.`);
            setPhase("error");
          }
        });
      } catch (caught) {
        if (!alive()) return;
        setError(
          caught instanceof Error
            ? caught.message
            : "The sandbox failed to start.",
        );
        setPhase("error");
      }
    },
    [pipe],
  );

  const reset = useCallback(() => {
    runIdRef.current += 1;
    if (devProcessRef.current) {
      devProcessRef.current.kill();
      devProcessRef.current = null;
    }
    setPhase("idle");
    setPreviewUrl(null);
    setLogs([]);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      runIdRef.current += 1;
      devProcessRef.current?.kill();
      devProcessRef.current = null;
    };
  }, []);

  const isolated = useSyncExternalStore(
    subscribeToIsolation,
    isSandboxSupported,
    () => false,
  );

  const busy =
    phase === "booting" ||
    phase === "mounting" ||
    phase === "installing" ||
    phase === "starting";

  return { phase, previewUrl, logs, error, busy, isolated, run, reset };
}
