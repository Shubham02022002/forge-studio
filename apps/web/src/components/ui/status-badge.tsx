import type { ProjectStatus } from "@/lib/api";
import { cn } from "@/lib/cn";

const styles: Record<ProjectStatus, { label: string; className: string; dot: string }> = {
  DRAFT: {
    label: "Draft",
    className: "border-line-strong text-faint",
    dot: "bg-faint",
  },
  GENERATING: {
    label: "Building",
    className: "border-forge-line bg-forge-soft text-forge",
    dot: "bg-forge animate-[forge-pulse_1.6s_ease-in-out_infinite]",
  },
  READY: {
    label: "Ready",
    className: "border-line-strong text-muted",
    dot: "bg-success",
  },
  FAILED: {
    label: "Failed",
    className: "border-danger/30 text-danger",
    dot: "bg-danger",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const s = styles[status] ?? styles.DRAFT;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        s.className,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}
