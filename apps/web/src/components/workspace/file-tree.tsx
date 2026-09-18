"use client";

import { useState } from "react";
import { ChevronRight, FileCode2, Folder, FolderOpen } from "lucide-react";
import type { TreeNode } from "@/lib/artifacts";
import { cn } from "@/lib/cn";

function Row({
  node,
  depth,
  selectedPath,
  streamingPath,
  collapsed,
  onToggle,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selectedPath: string | null;
  streamingPath: string | null;
  collapsed: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
}) {
  const isFolder = node.children.length > 0;
  const isCollapsed = collapsed.has(node.path);
  const isSelected = selectedPath === node.path;
  const isStreaming = streamingPath === node.path;

  return (
    <div>
      <button
        type="button"
        onClick={() => (isFolder ? onToggle(node.path) : onSelect(node.path))}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        className={cn(
          "group flex h-6 w-full items-center gap-1.5 pr-2 text-left text-[12px] transition-colors",
          isSelected
            ? "bg-elevated text-ink"
            : "text-muted hover:bg-panel hover:text-ink",
        )}
      >
        {isFolder ? (
          <>
            <ChevronRight
              className={cn(
                "size-3 shrink-0 text-faint transition-transform duration-150",
                !isCollapsed && "rotate-90",
              )}
              strokeWidth={2.2}
            />
            {isCollapsed ? (
              <Folder className="size-3.5 shrink-0 text-faint" strokeWidth={1.8} />
            ) : (
              <FolderOpen className="size-3.5 shrink-0 text-faint" strokeWidth={1.8} />
            )}
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            <FileCode2
              className={cn(
                "size-3.5 shrink-0",
                isStreaming ? "text-forge" : "text-faint",
              )}
              strokeWidth={1.8}
            />
          </>
        )}

        <span className={cn("truncate", isStreaming && "text-forge")}>
          {node.name}
        </span>

        {isStreaming && (
          <span className="ml-auto size-1.5 shrink-0 animate-[forge-pulse_1.2s_ease-in-out_infinite] rounded-full bg-forge" />
        )}
      </button>

      {isFolder && !isCollapsed && (
        <div>
          {node.children.map((child) => (
            <Row
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              streamingPath={streamingPath}
              collapsed={collapsed}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({
  nodes,
  selectedPath,
  streamingPath,
  onSelect,
}: {
  nodes: TreeNode[];
  selectedPath: string | null;
  streamingPath: string | null;
  onSelect: (path: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const onToggle = (path: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <div className="py-1.5">
      {nodes.map((node) => (
        <Row
          key={node.path}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          streamingPath={streamingPath}
          collapsed={collapsed}
          onToggle={onToggle}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
