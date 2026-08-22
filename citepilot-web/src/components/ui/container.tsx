import React from "react";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  size?: "narrow" | "default" | "wide" | "full";
  noPadding?: boolean;
  children?: React.ReactNode;
}

const SIZE_MAP: Record<"narrow" | "default" | "wide" | "full", string> = {
  narrow: "max-w-[800px]",
  default: "max-w-[1200px]",
  wide: "max-w-[1400px]",
  full: "max-w-full",
};

export function Container({
  as: Component = "div",
  size = "default",
  noPadding = false,
  className = "",
  children,
  ...props
}: ContainerProps) {
  const maxWidthClass = SIZE_MAP[size] ?? SIZE_MAP.default;
  const paddingClass = noPadding ? "" : "px-4 sm:px-6 lg:px-8";

  return (
    <Component
      className={`w-full mx-auto ${maxWidthClass} ${paddingClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Container;
