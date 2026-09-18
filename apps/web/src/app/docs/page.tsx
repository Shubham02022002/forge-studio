import type { Metadata } from "next";
import { AppRail } from "@/components/workspace/app-rail";

export const metadata: Metadata = {
  title: "Docs",
};

const sections = [
  {
    id: "how-it-works",
    title: "How it works",
    items: [
      "Describe your app by voice or text in the workspace.",
      "Forge scores your prompt for completeness and asks follow-up questions until the spec is unambiguous.",
      "A blueprint is generated — entities, features, screens and a design system.",
      "Code is streamed into a sandboxed container and runs in the live preview.",
    ],
  },
  {
    id: "voice",
    title: "Voice input",
    items: [
      "Hold Space anywhere in the composer to record.",
      "Release to transcribe. The raw transcript is rewritten into a precise build prompt.",
      "Filler words and false starts are removed before the prompt is used.",
    ],
  },
  {
    id: "github",
    title: "GitHub export",
    items: [
      "Connect your GitHub account once from settings.",
      "Forge creates a repository and pushes the full codebase with real commit history.",
      "You keep ownership — the repo is yours, with no lock-in.",
    ],
  },
  {
    id: "design",
    title: "Design system",
    items: [
      "Every generation is constrained by an enforced design system.",
      "Spacing, type scale, colour roles and component primitives are fixed, not improvised.",
      "The result is that generated apps look deliberate instead of auto-generated.",
    ],
  },
];

export default function DocsPage() {
  return (
    <main className="flex h-dvh w-full overflow-hidden">
      <AppRail />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-8 py-14">
          <h1 className="text-balance-tight text-2xl font-semibold text-ink">
            Documentation
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Everything Forge Studio does, and why it does it that way.
          </p>

          <div className="mt-12 flex flex-col gap-12">
            {sections.map((section) => (
              <section key={section.id} id={section.id}>
                <h2 className="text-[15px] font-semibold text-ink">
                  {section.title}
                </h2>
                <ul className="mt-4 flex flex-col gap-3 border-l border-line pl-5">
                  {section.items.map((item) => (
                    <li
                      key={item}
                      className="text-[13px] leading-relaxed text-muted"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
