"use client";

interface BrandLogoProps {
  variant?: "light" | "dark" | "auto";
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

export default function BrandLogo({
  variant = "auto",
  size = "md",
  showText = true,
  subtitle,
  onClick,
  className = "",
}: BrandLogoProps) {
  const isDark = variant === "dark";

  // Size mappings
  let iconSize = "w-7 h-7 text-xs";
  let textSize = "text-lg";

  if (size === "sm") {
    iconSize = "w-5 h-5 text-[10px]";
    textSize = "text-base";
  } else if (size === "lg") {
    iconSize = "w-9 h-9 text-base";
    textSize = "text-2xl";
  }

  return (
    <div
      className={`inline-flex items-center gap-2.5 font-bold ${
        onClick ? "cursor-pointer select-none" : ""
      } ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label="CitePilot Home"
    >
      {/* Signature Concentric Checkmark Emblem */}
      <span
        className={`${iconSize} rounded-full border flex items-center justify-center flex-none font-black shadow-none transition-transform hover:scale-105 ${
          isDark
            ? "border-[#027e6f] bg-[#027e6f]/20 text-[#a7dcd4]"
            : "border-[#a7dcd4] bg-[#e6f4f2] text-[#027e6f]"
        }`}
        aria-hidden="true"
      >
        <span className="relative top-[-0.5px]">✓</span>
      </span>

      {showText && (
        <div className="flex items-baseline gap-1.5 leading-none">
          <span
            className={`font-display font-extrabold tracking-tight ${textSize} ${
              isDark ? "text-white" : "text-[#0e101a]"
            }`}
          >
            CitePilot
          </span>
          {subtitle && (
            <span
              className={`text-xs font-mono font-bold uppercase tracking-wider ${
                isDark ? "text-slate-400" : "text-[#707070]"
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
