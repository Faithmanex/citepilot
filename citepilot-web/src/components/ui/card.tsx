import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  variant?: "paper" | "cloud" | "dark" | "teal" | "outlined" | "interactive";
  padding?: "none" | "sm" | "md" | "lg";
  children?: React.ReactNode;
}

const CARD_VARIANTS: Record<string, string> = {
  paper: "bg-[#ffffff] border border-[#ebebeb] text-[#0e101a]",
  cloud: "bg-[#f5f5f5] border border-[#ebebeb] text-[#0e101a]",
  dark: "bg-[#0e101a] border border-white/15 text-white",
  teal: "bg-[#02665a] border border-white/20 text-white",
  outlined: "bg-transparent border border-[#d9d9d9] text-[#0e101a]",
  interactive: "bg-[#ffffff] border border-[#ebebeb] text-[#0e101a] hover:border-[#d9d9d9] transition-colors cursor-pointer",
};

const CARD_PADDING: Record<string, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  as: Component = "div",
  variant = "paper",
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  const vClass = CARD_VARIANTS[variant] ?? CARD_VARIANTS.paper;
  const pClass = CARD_PADDING[padding] ?? CARD_PADDING.md;

  return (
    <Component
      className={`rounded-[8px] shadow-none ${vClass} ${pClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Card;
