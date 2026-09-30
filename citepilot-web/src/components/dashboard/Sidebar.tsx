"use client";

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

export default function Sidebar({
  activePanel,
  onPanelChange,
  isOpen = false,
  onClose,
  onOpenSubscription,
}: SidebarProps) {
  const router = useRouter();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`bg-[#221d16] border-r border-[#14181f] flex flex-col h-screen overflow-y-auto ${
          isOpen
            ? "fixed inset-y-0 left-0 z-50 w-64 shadow-none"
            : "hidden md:flex md:sticky md:top-0 w-[240px]"
        }`}
        role="navigation"
        aria-label="Primary"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#14181f]">
          <Link href="/" aria-label="CitePilot Home">
            <BrandLogo variant="dark" size="sm" />
          </Link>
          {onClose && (
            <button
              type="button"
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
              onClick={onClose}
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive = activePanel === item.panel;
            const Icon = item.icon;

            return (
              <button
                key={item.panel}
                className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
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
                <Icon className={`w-4 h-4 flex-none ${isActive ? "text-white" : "text-slate-400"}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 pt-2 border-t border-[#14181f] space-y-2">
          <button
            onClick={onOpenSubscription}
            className="w-full py-2.5 px-3 bg-[#2c3e8c] hover:bg-[#24357a] text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-none"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#c9cee8]" />
            Upgrade to Pro
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full py-2 px-3 text-[#948a76] hover:text-slate-200 hover:bg-white/5 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            aria-label="Back to home page"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </button>
        </div>
      </aside>
    </>
  );
}
