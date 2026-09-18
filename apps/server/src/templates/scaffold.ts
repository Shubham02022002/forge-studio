export interface ScaffoldFile {
  path: string;
  content: string;
}

export interface ScaffoldInput {
  title: string;
  primaryColor?: string;
  accentColor?: string;
}

const DEFAULT_PRIMARY = "#6366f1";
const DEFAULT_ACCENT = "#10b981";

function isHex(value: string | undefined): value is string {
  return typeof value === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

function clampByte(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function shade(hex: string, factor: number) {
  const raw = hex.trim().replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  if (!/^[0-9a-f]{6}$/i.test(full)) return hex;

  const n = parseInt(full, 16);
  const r = clampByte(((n >> 16) & 255) * factor);
  const g = clampByte(((n >> 8) & 255) * factor);
  const b = clampByte((n & 255) * factor);

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildScaffold({
  title,
  primaryColor,
  accentColor,
}: ScaffoldInput): ScaffoldFile[] {
  const primary = isHex(primaryColor) ? primaryColor.trim() : DEFAULT_PRIMARY;
  const accent = isHex(accentColor) ? accentColor.trim() : DEFAULT_ACCENT;

  const packageJson = {
    name: "forge-app",
    private: true,
    version: "0.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview",
    },
    dependencies: {
      clsx: "^2.1.1",
      "date-fns": "^4.1.0",
      "lucide-react": "^0.470.0",
      nanoid: "^5.0.9",
      react: "^19.0.0",
      "react-dom": "^19.0.0",
      "react-router-dom": "^6.28.0",
      recharts: "^2.15.0",
      "tailwind-merge": "^2.6.0",
      uuid: "^11.0.0",
    },
    devDependencies: {
      "@tailwindcss/vite": "^4.0.0",
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0",
      "@vitejs/plugin-react": "^4.3.4",
      tailwindcss: "^4.0.0",
      typescript: "~5.7.2",
      vite: "^6.0.0",
    },
  };

  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

  const viteConfig = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    strictPort: false,
  },
});`;

  const tsconfig = {
    compilerOptions: {
      target: "ES2022",
      useDefineForClassFields: true,
      lib: ["ES2022", "DOM", "DOM.Iterable"],
      module: "ESNext",
      skipLibCheck: true,
      moduleResolution: "bundler",
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      moduleDetection: "force",
      noEmit: true,
      jsx: "react-jsx",
      strict: true,
      noUnusedLocals: false,
      noUnusedParameters: false,
      noFallthroughCasesInSwitch: true,
    },
    include: ["src", "vite.config.ts"],
  };

  const indexCss = `@import "tailwindcss";

@theme {
  --color-primary-400: ${shade(primary, 1.2)};
  --color-primary-500: ${primary};
  --color-primary-600: ${shade(primary, 0.84)};
  --color-primary-700: ${shade(primary, 0.7)};
  --color-accent-400: ${shade(accent, 1.2)};
  --color-accent-500: ${accent};
  --color-accent-600: ${shade(accent, 0.84)};
}

html,
body,
#root {
  height: 100%;
}

body {
  margin: 0;
  background-color: #09090b;
  color: #fafafa;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: #09090b;
}

::-webkit-scrollbar-thumb {
  background-color: #27272a;
  border-radius: 9999px;
  border: 2px solid #09090b;
}

::-webkit-scrollbar-thumb:hover {
  background-color: #3f3f46;
}`;

  const mainTsx = `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error('Root element "#root" was not found in index.html');
}

createRoot(container).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);`;

  const viteEnv = `/// <reference types="vite/client" />`;

  return [
    { path: "package.json", content: JSON.stringify(packageJson, null, 2) },
    { path: "index.html", content: indexHtml },
    { path: "vite.config.ts", content: viteConfig },
    { path: "tsconfig.json", content: JSON.stringify(tsconfig, null, 2) },
    { path: "src/index.css", content: indexCss },
    { path: "src/main.tsx", content: mainTsx },
    { path: "src/vite-env.d.ts", content: viteEnv },
  ];
}

export const SCAFFOLD_PATHS = [
  "package.json",
  "index.html",
  "vite.config.ts",
  "tsconfig.json",
  "src/index.css",
  "src/main.tsx",
  "src/vite-env.d.ts",
];

export const PREINSTALLED_PACKAGES = [
  "react",
  "react-dom",
  "react-router-dom",
  "lucide-react",
  "clsx",
  "tailwind-merge",
  "recharts",
  "date-fns",
];

export const ARTIFACT_CLOSE = "</forgeArtifact>";

export function buildArtifactPreamble(
  title: string,
  files: ScaffoldFile[],
): string {
  const lines = [`<forgeArtifact id="app-build" title="${escapeAttribute(title)}">`];

  for (const file of files) {
    lines.push(`<forgeAction type="file" filePath="${escapeAttribute(file.path)}">`);
    lines.push(file.content);
    lines.push("</forgeAction>");
  }

  return `${lines.join("\n")}\n`;
}
