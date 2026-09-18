import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "icon" | "icon-sm";

const variants: Record<Variant, string> = {
  primary:
    "bg-forge text-canvas font-semibold shadow-[inset_0_1px_0_oklch(1_0_0/25%)] hover:brightness-110 active:brightness-95",
  secondary:
    "bg-elevated text-ink border border-line-strong shadow-[inset_0_1px_0_oklch(1_0_0/6%)] hover:bg-raised",
  outline:
    "border border-line-strong text-muted hover:text-ink hover:bg-elevated",
  ghost: "text-muted hover:text-ink hover:bg-elevated",
};

const sizes: Record<Size, string> = {
  sm: "h-7 px-2.5 text-[13px] gap-1.5 rounded-sm",
  md: "h-9 px-3.5 text-sm gap-2 rounded-md",
  icon: "size-9 rounded-md",
  "icon-sm": "size-7 rounded-sm",
};

export function buttonClass(
  variant: Variant = "secondary",
  size: Size = "md",
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center whitespace-nowrap",
    "transition-[background-color,color,filter,opacity,transform] duration-150",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}
