import { cn } from "@/lib/cn";

export function ForgeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("size-5", className)} aria-hidden>
      <defs>
        <linearGradient id="forge-mark" x1="4" y1="2" x2="20" y2="22">
          <stop offset="0%" stopColor="oklch(0.86 0.15 62)" />
          <stop offset="100%" stopColor="oklch(0.68 0.17 38)" />
        </linearGradient>
      </defs>
      <path
        d="M12 1.5c0 5.2 1.3 7.6 6.4 9.3.5.2.5.9 0 1.1-5.1 1.7-6.4 4.1-6.4 9.3 0 .5-.7.7-.9.2-2.4-6.5-4.6-8.2-9.7-9.4-.5-.1-.5-.8 0-.9 5.1-1.2 7.3-2.9 9.7-9.4.2-.5.9-.5.9.1Z"
        fill="url(#forge-mark)"
      />
    </svg>
  );
}

export function ForgeLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <ForgeMark className="size-[18px]" />
      <span className="text-[13px] font-semibold tracking-[-0.02em] text-ink">
        Forge Studio
      </span>
    </span>
  );
}
