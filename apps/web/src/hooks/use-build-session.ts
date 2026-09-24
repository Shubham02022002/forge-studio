"use client";

import { useCallback, useRef, useState } from "react";
import {
  clarifyPrompt,
  generateBlueprint,
  type ClarificationQuestion,
  type ProductBlueprint,
} from "@/lib/api";

export type BuildMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string }
  | { id: string; role: "assistant"; blueprint: ProductBlueprint };

export interface ActiveQuestions {
  score: number;
  questions: ClarificationQuestion[];
}

const MAX_ROUNDS = 3;

function enrich(base: string, answers: Record<string, string>) {
  const entries = Object.entries(answers);
  if (entries.length === 0) return base;
  const context = entries.map(([q, a]) => `- ${q}: ${a}`).join("\n");
  return `${base}\n\nAdditional context:\n${context}`;
}

export function useBuildSession() {
  const [messages, setMessages] = useState<BuildMessage[]>([]);
  const [active, setActive] = useState<ActiveQuestions | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");

  const idRef = useRef(0);
  const roundRef = useRef(0);
  const promptRef = useRef("");
  const answersRef = useRef<Record<string, string>>({});

  const push = useCallback((message: BuildMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const fail = useCallback((e: unknown) => {
    setError(e instanceof Error ? e.message : "Something went wrong.");
  }, []);

  const runClarify = useCallback(
    async (basePrompt: string, round: number) => {
      const result = await clarifyPrompt(
        enrich(basePrompt, answersRef.current),
      );

      push({ id: `a${++idRef.current}`, role: "assistant", text: result.summary });

      const hasQuestions = Boolean(result.questions?.length);
      if (result.isAmbiguous && hasQuestions && round < MAX_ROUNDS) {
        setActive({
          score: result.completenessScore,
          questions: result.questions as ClarificationQuestion[],
        });
        return;
      }

      setActive(null);
      const blueprint = await generateBlueprint(basePrompt, answersRef.current);
      push({ id: `a${++idRef.current}`, role: "assistant", blueprint });
    },
    [push],
  );

  const send = useCallback(
    async (text: string) => {
      setError(null);
      setBusy(true);
      promptRef.current = text;
      setPrompt(text);
      answersRef.current = {};
      roundRef.current = 1;
      setActive(null);
      push({ id: `u${++idRef.current}`, role: "user", text });

      try {
        await runClarify(text, 1);
      } catch (e) {
        fail(e);
      } finally {
        setBusy(false);
      }
    },
    [fail, push, runClarify],
  );

  const answer = useCallback(
    async (answers: Record<string, string>) => {
      setError(null);
      setBusy(true);
      answersRef.current = { ...answersRef.current, ...answers };
      roundRef.current += 1;
      setActive(null);
      push({
        id: `u${++idRef.current}`,
        role: "user",
        text: Object.values(answers).join("  ·  "),
      });

      try {
        await runClarify(promptRef.current, roundRef.current);
      } catch (e) {
        fail(e);
      } finally {
        setBusy(false);
      }
    },
    [fail, push, runClarify],
  );

  const recordUser = useCallback(
    (text: string) => {
      push({ id: `u${++idRef.current}`, role: "user", text });
    },
    [push],
  );

  const recordAssistant = useCallback(
    (text: string) => {
      push({ id: `a${++idRef.current}`, role: "assistant", text });
    },
    [push],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setActive(null);
    setError(null);
    setBusy(false);
    setPrompt("");
    answersRef.current = {};
    promptRef.current = "";
    roundRef.current = 0;
  }, []);

  const hydrateMessages = useCallback(
    (
      serverMessages: Array<{
        id: string;
        role: string;
        type: string;
        content: string;
      }>,
    ) => {
      const buildMessages: BuildMessage[] = [];
      for (const m of serverMessages) {
        if (m.type === "code") continue;
        if (m.type === "blueprint" && m.role === "assistant") {
          try {
            buildMessages.push({
              id: m.id,
              role: m.role,
              blueprint: JSON.parse(m.content),
            });
          } catch {
            buildMessages.push({ id: m.id, role: m.role, text: m.content });
          }
        } else if (m.role === "user") {
          buildMessages.push({
            id: m.id,
            role: "user",
            text: m.content,
          });
        } else {
          buildMessages.push({
            id: m.id,
            role: "assistant",
            text: m.content,
          });
        }
      }
      setMessages(buildMessages);
    },
    [],
  );

  return {
    messages,
    active,
    busy,
    error,
    prompt,
    send,
    answer,
    reset,
    hydrateMessages,
    recordUser,
    recordAssistant,
  };
}
