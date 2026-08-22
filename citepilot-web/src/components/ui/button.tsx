"use client";

import React, { forwardRef } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

export type ButtonVariant =
  | "primary"
  | "primary-teal"
  | "secondary"
  | "secondary-dark"
  | "ghost-white"
  | "ghostWhite"
  | "subdued"
  | "subdued-ghost"
  | "ghost";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual hierarchy variant */
  variant?: ButtonVariant;
  /** Component height and typography size scale */
  size?: ButtonSize;
  /** Appends a right arrow icon (Lucide ArrowRight) with hover translate effect */
  withArrow?: boolean;
  /** Custom icon rendered before button content */
  leftIcon?: React.ReactNode;
  /** Custom icon rendered after button content */
  rightIcon?: React.ReactNode;
  /** Replaces right/arrow icon with an animated spinner, sets disabled and aria-busy */
  isLoading?: boolean;
  /** Expands button width to 100% of container */
  fullWidth?: boolean;
  /** Child elements */
  children?: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  // Primary Teal Filled
  primary:
    "bg-[#027e6f] text-white border border-[#027e6f] hover:bg-[#02665a] hover:border-[#02665a] active:bg-[#014d44] active:border-[#014d44] focus-visible:ring-[#027e6f] focus-visible:ring-offset-white font-bold",
  "primary-teal":
    "bg-[#027e6f] text-white border border-[#027e6f] hover:bg-[#02665a] hover:border-[#02665a] active:bg-[#014d44] active:border-[#014d44] focus-visible:ring-[#027e6f] focus-visible:ring-offset-white font-bold",

  // Secondary Dark Outlined
  secondary:
    "bg-transparent text-[#0e101a] border border-[#0e101a] hover:bg-[#0e101a] hover:text-white hover:border-[#0e101a] active:bg-[#1c1c1c] active:text-white active:border-[#1c1c1c] focus-visible:ring-[#0e101a] focus-visible:ring-offset-white font-semibold",
  "secondary-dark":
    "bg-transparent text-[#0e101a] border border-[#0e101a] hover:bg-[#0e101a] hover:text-white hover:border-[#0e101a] active:bg-[#1c1c1c] active:text-white active:border-[#1c1c1c] focus-visible:ring-[#0e101a] focus-visible:ring-offset-white font-semibold",

  // Ghost White Outlined (for teal / dark backgrounds)
  "ghost-white":
    "bg-transparent text-white border border-white/80 hover:bg-white/15 hover:border-white hover:text-white active:bg-white/25 active:border-white focus-visible:ring-white focus-visible:ring-offset-[#027e6f] font-semibold",
  ghostWhite:
    "bg-transparent text-white border border-white/80 hover:bg-white/15 hover:border-white hover:text-white active:bg-white/25 active:border-white focus-visible:ring-white focus-visible:ring-offset-[#027e6f] font-semibold",

  // Subdued Ghost (tertiary / subtle actions)
  subdued:
    "bg-transparent text-[#545454] border border-transparent hover:bg-[#f5f5f5] hover:text-[#0e101a] active:bg-[#ebebeb] active:text-[#0e101a] focus-visible:ring-[#0e101a] focus-visible:ring-offset-1 font-medium",
  "subdued-ghost":
    "bg-transparent text-[#545454] border border-transparent hover:bg-[#f5f5f5] hover:text-[#0e101a] active:bg-[#ebebeb] active:text-[#0e101a] focus-visible:ring-[#0e101a] focus-visible:ring-offset-1 font-medium",
  ghost:
    "bg-transparent text-[#545454] border border-transparent hover:bg-[#f5f5f5] hover:text-[#0e101a] active:bg-[#ebebeb] active:text-[#0e101a] focus-visible:ring-[#0e101a] focus-visible:ring-offset-1 font-medium",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-[13px] gap-1.5 min-h-[36px]",
  md: "h-11 px-4.5 sm:px-5 text-[14px] gap-2 min-h-[44px]",
  lg: "h-[52px] px-6 text-[16px] gap-2.5 min-h-[52px]",
};

const iconSizes: Record<ButtonSize, string> = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-[18px] h-[18px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      withArrow = false,
      leftIcon,
      rightIcon,
      isLoading = false,
      fullWidth = false,
      disabled = false,
      className = "",
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const selectedVariant = variantStyles[variant] || variantStyles.primary;
    const selectedSize = sizeStyles[size] || sizeStyles.md;
    const iconSizeClass = iconSizes[size] || iconSizes.md;
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading ? "true" : undefined}
        className={[
          "group inline-flex items-center justify-center select-none cursor-pointer tracking-[-0.01em]",
          "rounded-lg shadow-none", // Strict 8px radius standard, zero drop shadows
          "transition-all duration-150 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          selectedVariant,
          selectedSize,
          fullWidth ? "w-full" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {isLoading && (
          <Loader2
            className={`${iconSizeClass} animate-spin flex-shrink-0`}
            aria-hidden="true"
          />
        )}

        {!isLoading && leftIcon && (
          <span className="inline-flex items-center flex-shrink-0">{leftIcon}</span>
        )}

        {children && <span className="truncate">{children}</span>}

        {!isLoading && rightIcon && (
          <span className="inline-flex items-center flex-shrink-0">{rightIcon}</span>
        )}

        {!isLoading && withArrow && !rightIcon && (
          <ArrowRight
            className={`${iconSizeClass} flex-shrink-0 transition-transform duration-150 ease-in-out group-hover:translate-x-0.5 group-active:translate-x-1`}
            aria-hidden="true"
          />
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
