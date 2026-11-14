"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandLogo from "../brand/BrandLogo";
import {
  FileText,
  History,
  FileDown,
  Sparkles,
  X,
  ArrowLeft,
} from "lucide-react";

interface SidebarProps {
  activePanel: string;
  onPanelChange: (panel: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenSubscription?: () => void;
}

const navItems = [
  { panel: "editor", icon: FileText, label: "Editor" },
  { panel: "history", icon: History, label: "History" },
  { panel: "export", icon: FileDown, label: "Export" },
];

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Sidebar({
  activePanel,
  onPanelChange,
  isOpen = false,
  onClose,
  onOpenSubscription,
}: SidebarProps) {
  const router = useRouter();
  const asideRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // The mobile drawer is a modal overlay: focus moves in, stays inside,
  // Escape closes it, background content is inert, and focus is restored.
  useEffect(() => {
    if (!isOpen) return;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const main = document.getElementById("dashboard-main");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (main) {
      main.setAttribute("inert", "");
      main.setAttribute("aria-hidden", "true");
    }
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;
      const aside = asideRef.current;
      if (!aside) return;
      const focusable = Array.from(
        aside.querySelectorAll<HTMLElement>(FOCUSABLE)
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (main) {
        main.removeAttribute("inert");
        main.removeAttribute("aria-hidden");
      }
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        ref={asideRef}
        id="primary-navigation"
        className={`bg-[#221d16] border-r border-[#14181f] flex flex-col h-screen overflow-y-auto ${
          isOpen
            ? "fixed inset-y-0 left-0 z-50 w-64 shadow-none"
            : "hidden md:flex md:sticky md:top-0 w-[240px]"
        }`}
        role="navigation"
        aria-label="Primary"
      >
        {/* Brand header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#14181f]">
          <Link href="/" aria-label="CitePilot home">
            <BrandLogo variant="dark" size="sm" />
          </Link>
          {onClose && (
            <button
              ref={closeButtonRef}
              type="button"
              className="md:hidden text-[#c9cee8] hover:text-white p-2 min-w-11 min-h-11 flex items-center justify-center rounded-lg"
              onClick={onClose}
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Workspace panels">
          {navItems.map((item) => {
            const isActive = activePanel === item.panel;
            const Icon = item.icon;

            return (
              <button
                key={item.panel}
                className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 min-h-11 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#2c3e8c] text-white shadow-none"
                    : "text-[#d9cfb8] hover:text-white hover:bg-white/10"
                }`}
                onClick={() => {
                  onPanelChange(item.panel);
                  if (onClose) onClose();
                }}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={`w-4 h-4 flex-none ${isActive ? "text-white" : "text-[#9ca3b0]"}`}
                  aria-hidden="true"
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 pt-2 border-t border-[#14181f] space-y-2">
          <button
            onClick={onOpenSubscription}
            className="w-full py-2.5 px-3 min-h-11 bg-[#2c3e8c] hover:bg-[#24357a] text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-none"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#c9cee8]" aria-hidden="true" />
            Upgrade to Pro
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full py-2 px-3 min-h-11 text-[#c9cee8] hover:text-white hover:bg-white/5 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            aria-label="Back to home page"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Back to home
          </button>
        </div>
      </aside>
    </>
  );
}
