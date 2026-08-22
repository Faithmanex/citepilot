"use client";

import React from "react";

export type BadgeVariant =
  | "teal"
  | "amber"
  | "violet"
  | "slate"
  | "red"
  | "blue"
  | "dark"
  | "outline"
  | "missing-citation"
  | "claim-needs-source"
  | "outdated-reference"
  | "tone-clarity"
  | "verified"
  | "warning"
  | "error"
  | "info";

export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  count?: number | string;
  dot?: boolean;
  interactive?: boolean;
  onDismiss?: () => void;
  fontMono?: boolean;
  uppercase?: boolean;
  children?: React.ReactNode;
}

const VARIANT_STYLES: Record<
  BadgeVariant,
  { bg: string; text: string; border: string; dot: string; hover: string }
> = {
  // Teal (Missing Citation / Verified)
  teal: {
    bg: "bg-[#e6f4f2]",
    text: "text-[#027e6f]",
    border: "border-[#a7dcd4]",
    dot: "bg-[#027e6f]",
    hover: "hover:bg-[#d5eee9]",
  },
  "missing-citation": {
    bg: "bg-[#e6f4f2]",
    text: "text-[#027e6f]",
    border: "border-[#a7dcd4]",
    dot: "bg-[#027e6f]",
    hover: "hover:bg-[#d5eee9]",
  },
  verified: {
    bg: "bg-[#e6f4f2]",
    text: "text-[#027e6f]",
    border: "border-[#a7dcd4]",
    dot: "bg-[#027e6f]",
    hover: "hover:bg-[#d5eee9]",
  },

  // Amber (Claim Needs Source / Warning)
  amber: {
    bg: "bg-[#fef3c7]",
    text: "text-[#92400e]",
    border: "border-[#fde68a]",
    dot: "bg-[#b45309]",
    hover: "hover:bg-[#fde68a]/60",
  },
  "claim-needs-source": {
    bg: "bg-[#fef3c7]",
    text: "text-[#92400e]",
    border: "border-[#fde68a]",
    dot: "bg-[#b45309]",
    hover: "hover:bg-[#fde68a]/60",
  },
  warning: {
    bg: "bg-[#fef3c7]",
    text: "text-[#92400e]",
    border: "border-[#fde68a]",
    dot: "bg-[#b45309]",
    hover: "hover:bg-[#fde68a]/60",
  },

  // Violet (Outdated Reference)
  violet: {
    bg: "bg-[#ede9fe]",
    text: "text-[#5b21b6]",
    border: "border-[#ddd6fe]",
    dot: "bg-[#5b21b6]",
    hover: "hover:bg-[#ddd6fe]/60",
  },
  "outdated-reference": {
    bg: "bg-[#ede9fe]",
    text: "text-[#5b21b6]",
    border: "border-[#ddd6fe]",
    dot: "bg-[#5b21b6]",
    hover: "hover:bg-[#ddd6fe]/60",
  },

  // Slate (Tone & Clarity / Neutral)
  slate: {
    bg: "bg-[#f5f5f5]",
    text: "text-[#1f243c]",
    border: "border-[#d9d9d9]",
    dot: "bg-[#4d536e]",
    hover: "hover:bg-[#ebebeb]",
  },
  "tone-clarity": {
    bg: "bg-[#f5f5f5]",
    text: "text-[#1f243c]",
    border: "border-[#d9d9d9]",
    dot: "bg-[#4d536e]",
    hover: "hover:bg-[#ebebeb]",
  },

  // Red (Error / Retraction Alert)
  red: {
    bg: "bg-[#fee2e2]",
    text: "text-[#b91c1c]",
    border: "border-[#fca5a5]",
    dot: "bg-[#b91c1c]",
    hover: "hover:bg-[#fca5a5]/60",
  },
  error: {
    bg: "bg-[#fee2e2]",
    text: "text-[#b91c1c]",
    border: "border-[#fca5a5]",
    dot: "bg-[#b91c1c]",
    hover: "hover:bg-[#fca5a5]/60",
  },

  // Blue (Info / Style Advisory)
  blue: {
    bg: "bg-[#eff6ff]",
    text: "text-[#2563eb]",
    border: "border-[#bfdbfe]",
    dot: "bg-[#2563eb]",
    hover: "hover:bg-[#bfdbfe]/60",
  },
  info: {
    bg: "bg-[#eff6ff]",
    text: "text-[#2563eb]",
    border: "border-[#bfdbfe]",
    dot: "bg-[#2563eb]",
    hover: "hover:bg-[#bfdbfe]/60",
  },

  // Dark (On dark canvases)
  dark: {
    bg: "bg-white/10",
    text: "text-white",
    border: "border-white/20",
    dot: "bg-white",
    hover: "hover:bg-white/15",
  },

  // Outline (Achromatic)
  outline: {
    bg: "bg-transparent",
    text: "text-[#0e101a]",
    border: "border-[#d9d9d9]",
    dot: "bg-[#545454]",
    hover: "hover:bg-[#f5f5f5]",
  },
};

const SIZE_STYLES: Record<BadgeSize, { container: string; text: string; icon: string; dot: string }> = {
  sm: {
    container: "h-[22px] px-2 gap-1 rounded-[8px]",
    text: "text-[11px]",
    icon: "w-3 h-3",
    dot: "w-1.5 h-1.5",
  },
  md: {
    container: "h-[28px] px-2.5 gap-1.5 rounded-[8px]",
    text: "text-xs",
    icon: "w-3.5 h-3.5",
    dot: "w-2 h-2",
  },
  lg: {
    container: "h-[34px] px-3.5 gap-2 rounded-[8px]",
    text: "text-sm",
    icon: "w-4 h-4",
    dot: "w-2.5 h-2.5",
  },
};

export function Badge({
  variant = "teal",
  size = "md",
  icon,
  count,
  dot = false,
  interactive = false,
  onDismiss,
  fontMono = false,
  uppercase = false,
  className = "",
  children,
  ...props
}: BadgeProps) {
  const vStyle = VARIANT_STYLES[variant] ?? VARIANT_STYLES.teal;
  const sStyle = SIZE_STYLES[size] ?? SIZE_STYLES.md;

  return (
    <span
      className={[
        "inline-flex items-center justify-center font-bold select-none border shadow-none",
        sStyle.container,
        sStyle.text,
        vStyle.bg,
        vStyle.text,
        vStyle.border,
        fontMono ? "font-mono" : "font-sans",
        uppercase ? "uppercase tracking-wider" : "tracking-normal",
        interactive ? `cursor-pointer transition-colors ${vStyle.hover}` : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {/* Optional Leading Status Dot */}
      {dot && (
        <span
          className={`${sStyle.dot} rounded-[4px] flex-none ${vStyle.dot}`}
          aria-hidden="true"
        />
      )}

      {/* Optional Leading Icon */}
      {icon && (
        <span className={`${sStyle.icon} flex items-center justify-center flex-none`} aria-hidden="true">
          {icon}
        </span>
      )}

      {/* Main Label */}
      {children && <span className="truncate">{children}</span>}

      {/* Optional Numerical Counter */}
      {count !== undefined && (
        <span
          className="ml-1 px-1.5 py-0.2 rounded-[6px] bg-black/10 text-[10px] font-mono font-extrabold leading-tight"
          aria-label={`Count: ${count}`}
        >
          {count}
        </span>
      )}

      {/* Optional Dismiss Action Button */}
      {onDismiss && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          aria-label="Dismiss tag"
          className="ml-1 -mr-0.5 p-0.5 rounded-[4px] hover:bg-black/10 transition-colors cursor-pointer inline-flex items-center justify-center"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}

export default Badge;
