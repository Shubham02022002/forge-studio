"use client";

import { useEffect, useRef, useState } from "react";
import type { HighlighterCore, ThemedToken } from "shiki";

let highlighterPromise: Promise<HighlighterCore> | null = null;

const LOADED_LANGS = new Set<string>();

const LANG_IMPORTS: Record<string, () => Promise<unknown>> = {
  typescript: () => import("shiki/langs/typescript.mjs"),
  tsx: () => import("shiki/langs/tsx.mjs"),
  javascript: () => import("shiki/langs/javascript.mjs"),
  jsx: () => import("shiki/langs/jsx.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  css: () => import("shiki/langs/css.mjs"),
  html: () => import("shiki/langs/html.mjs"),
  markdown: () => import("shiki/langs/markdown.mjs"),
  sql: () => import("shiki/langs/sql.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
  prisma: () => import("shiki/langs/prisma.mjs"),
};

async function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      const [{ createHighlighterCore }, { createOnigurumaEngine }] =
        await Promise.all([
          import("shiki/core"),
          import("shiki/engine/oniguruma"),
        ]);

      return createHighlighterCore({
        themes: [import("shiki/themes/github-dark-default.mjs")],
        langs: [],
        engine: createOnigurumaEngine(import("shiki/wasm")),
      });
    })();
  }
  return highlighterPromise;
}

async function ensureLang(hl: HighlighterCore, lang: string): Promise<string> {
  if (LOADED_LANGS.has(lang)) return lang;

  const loader = LANG_IMPORTS[lang];
  if (!loader) return "text";

  try {
    const mod = await loader();
    await hl.loadLanguage(mod as Parameters<HighlighterCore["loadLanguage"]>[0]);
    LOADED_LANGS.add(lang);
    return lang;
  } catch {
    return "text";
  }
}

export type TokenLine = ThemedToken[];

export function useHighlighter(code: string, lang: string): TokenLine[] | null {
  const [tokens, setTokens] = useState<TokenLine[] | null>(null);
  const revRef = useRef(0);

  useEffect(() => {
    const rev = ++revRef.current;

    (async () => {
      try {
        const hl = await getHighlighter();
        const resolvedLang = await ensureLang(hl, lang);

        if (rev !== revRef.current) return;

        if (resolvedLang === "text") {
          setTokens(null);
          return;
        }

        const result = hl.codeToTokens(code, {
          lang: resolvedLang,
          theme: "github-dark-default",
        });

        if (rev === revRef.current) {
          setTokens(result.tokens);
        }
      } catch {
        if (rev === revRef.current) setTokens(null);
      }
    })();
  }, [code, lang]);

  return tokens;
}
