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

  const reset = useCallback(() => {
    setMessages([]);
    setActive(null);
    setError(null);
    setBusy(false);
    answersRef.current = {};
    promptRef.current = "";
    roundRef.current = 0;
  }, []);

  return { messages, active, busy, error, send, answer, reset };
}
