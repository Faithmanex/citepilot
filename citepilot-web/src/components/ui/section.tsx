import React from "react";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  variant?: "paper" | "cloud" | "midnight" | "ink" | "teal" | "bordered";
  spacing?: "compact" | "standard" | "hero" | "enterprise" | "none";
  containerSize?: "narrow" | "default" | "wide" | "full";
  noContainer?: boolean;
  children?: React.ReactNode;
}

const VARIANT_MAP: Record<string, string> = {
  paper: "bg-[#ffffff] text-[#0e101a]",
  cloud: "bg-[#f5f5f5] text-[#0e101a] border-y border-[#ebebeb]",
  midnight: "bg-[#1f243c] text-white",
  ink: "bg-[#0e101a] text-white",
  teal: "bg-[#027e6f] text-white",
  bordered: "bg-[#ffffff] text-[#0e101a] border-b border-[#ebebeb]",
};

const SPACING_MAP: Record<string, string> = {
  none: "py-0",
  compact: "py-10 md:py-14",
  standard: "py-16 md:py-24 lg:py-28",
  hero: "pt-16 pb-20 md:pt-24 md:pb-28 lg:pt-32 lg:pb-36",
  enterprise: "py-20 md:py-28",
};

export function Section({
  as: Component = "section",
  variant = "paper",
  spacing = "standard",
  containerSize = "default",
  noContainer = false,
  className = "",
  children,
  ...props
}: SectionProps) {
  const variantClass = VARIANT_MAP[variant] ?? VARIANT_MAP.paper;
  const spacingClass = SPACING_MAP[spacing] ?? SPACING_MAP.standard;

  return (
    <Component className={`relative w-full ${variantClass} ${spacingClass} ${className}`.trim()} {...props}>
      {noContainer ? (
        children
      ) : (
        <div
          className={`w-full mx-auto px-4 sm:px-6 lg:px-8 ${
            containerSize === "narrow"
              ? "max-w-[800px]"
              : containerSize === "wide"
              ? "max-w-[1400px]"
              : containerSize === "full"
              ? "max-w-full"
              : "max-w-[1200px]"
          }`}
        >
          {children}
        </div>
      )}
    </Component>
  );
}

export default Section;
