import type { Metadata } from "next";
import { AppRail } from "@/components/workspace/app-rail";
import { ChatPane } from "@/components/workspace/chat-pane";
import { PreviewPane } from "@/components/workspace/preview-pane";

export const metadata: Metadata = {
  title: "Workspace",
};

export default function WorkspacePage() {
  return (
    <main className="flex h-dvh w-full overflow-hidden">
      <AppRail />
      <ChatPane />
      <PreviewPane />
    </main>
  );
}
