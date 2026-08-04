"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandLogo from "../brand/BrandLogo";
import {
  LayoutDashboard,
  GitCompare,
  CheckCircle2,
  BookOpenCheck,
  AlertTriangle,
  Clock,
  FileSpreadsheet,
  FileDown,
  Sparkles,
  X,
  ArrowLeft,
} from "lucide-react";

interface SidebarProps {
  activePanel: string;
  onPanelChange: (panel: string) => void;
  badges: Record<string, number>;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenSubscription?: () => void;
}

const navItems = [
  { panel: "overview",  icon: LayoutDashboard, label: "Overview",           badgeKey: null },
  { panel: "matching",  icon: GitCompare,       label: "Citation Matching",  badgeKey: "matching" },
  { panel: "crossref",  icon: CheckCircle2,     label: "Crossref Check",     badgeKey: "crossref" },
  { panel: "style",     icon: BookOpenCheck,    label: "Style Rules",        badgeKey: "style" },
  { panel: "claims",    icon: AlertTriangle,    label: "Uncited Claims",     badgeKey: "claims" },
  { panel: "recency",   icon: Clock,            label: "Recency Analysis",   badgeKey: null },
  { panel: "structure", icon: FileSpreadsheet,  label: "Document Structure", badgeKey: null },
  { panel: "export",    icon: FileDown,         label: "Export Report",      badgeKey: null },
];

export default function Sidebar({
  activePanel,
  onPanelChange,
  badges,
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
        className={`bg-[#14181F] border-r border-[#252B36] flex flex-col h-screen overflow-y-auto ${
          isOpen
            ? "fixed inset-y-0 left-0 z-50 w-64 shadow-2xl"
            : "hidden md:flex md:sticky md:top-0 w-[240px]"
        }`}
        role="navigation"
        aria-label="Audit Navigation"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#252B36]">
          <Link href="/" aria-label="CitePilot Home">
            <BrandLogo variant="dark" size="sm" subtitle="AUDIT" />
          </Link>
          {onClose && (
            <button
              type="button"
              className="md:hidden text-slate-400 hover:text-white p-1 rounded"
              onClick={onClose}
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 px-2 pb-2 font-mono">
            Audit Sections
          </p>
          {navItems.map((item) => {
            const badgeCount = item.badgeKey ? badges[item.badgeKey] ?? 0 : 0;
            const isActive = activePanel === item.panel;
            const Icon = item.icon;

            return (
              <button
                key={item.panel}
                className={`flex items-center justify-between w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#1E5E4B] text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-white/8"
                }`}
                onClick={() => {
                  onPanelChange(item.panel);
                  if (onClose) onClose();
                }}
                aria-current={isActive ? "page" : undefined}
              >
                <div className="flex items-center gap-2.5 truncate min-w-0">
                  <Icon className={`w-4 h-4 flex-none ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badgeKey && badgeCount > 0 && (
                  <span className={`ml-2 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full flex-none ${isActive ? "bg-white/20 text-white" : "bg-[#961E14] text-white"}`}>
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 pt-2 border-t border-[#252B36] space-y-2">
          <button
            onClick={onOpenSubscription}
            className="w-full py-2.5 px-3 bg-[#1E5E4B] hover:bg-[#285235] text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C7BC9F]" />
            Upgrade to Pro
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full py-2 px-3 text-slate-400 hover:text-slate-200 hover:bg-white/5 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
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
