"use client";

interface SidebarProps {
  activePanel: string;
  onPanelChange: (panel: string) => void;
  badges: Record<string, number>;
  isOpen?: boolean;
  onClose?: () => void;
}

const navGroups = [
  {
    label: "Audit & Verification",
    items: [
      { panel: "overview", icon: "◆", label: "Overview", badgeKey: null },
      { panel: "matching", icon: "↔", label: "Citation Matching", badgeKey: "matching" },
      { panel: "crossref", icon: "✓", label: "Crossref & Retraction", badgeKey: "crossref" },
      { panel: "style", icon: "§", label: "Style Rules", badgeKey: "style" },
      { panel: "claims", icon: "!", label: "Uncited Claims", badgeKey: "claims" },
    ],
  },
  {
    label: "Analytics & Layout",
    items: [
      { panel: "recency", icon: "◔", label: "Recency Analytics", badgeKey: null },
      { panel: "structure", icon: "▤", label: "Document Layout", badgeKey: null },
    ],
  },
  {
    label: "Output & Export",
    items: [
      { panel: "export", icon: "⇩", label: "Feedback & Export", badgeKey: null },
    ],
  },
];

export default function Sidebar({
  activePanel,
  onPanelChange,
  badges,
  isOpen = false,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`bg-sidebar text-sidebar-text p-5 pr-3.5 h-screen overflow-y-auto ${
          isOpen ? "fixed inset-y-0 left-0 z-50 w-64 shadow-2xl" : "hidden md:block md:sticky md:top-0"
        }`}
        role="navigation"
        aria-label="Audit Drawer Navigation"
      >
        <div className="flex items-center justify-between px-2.5 pb-[22px] pt-1.5 font-extrabold text-[17px] text-white">
          <div className="flex items-center gap-[9px]">
            <span
              className="w-[9px] h-[9px] rounded-[1px] mr-3"
              style={{
                background: "var(--color-verified)",
                boxShadow: "10px 0 0 var(--color-warning), 20px 0 0 var(--color-error)",
              }}
              aria-hidden="true"
            />
            CitePilot Audit
          </div>
          {onClose && (
            <button
              type="button"
              className="md:hidden text-sidebar-text hover:text-white p-1"
              onClick={onClose}
              aria-label="Close navigation drawer"
            >
              <i className="fas fa-times text-lg" />
            </button>
          )}
        </div>

        {navGroups.map((group) => (
          <div key={group.label} className="mb-1">
            <div className="font-mono text-[11px] font-bold tracking-wider uppercase text-[#94A3B8] pt-4 pb-2 px-2.5">
              {group.label}
            </div>
            {group.items.map((item) => {
              const badgeCount = item.badgeKey ? badges[item.badgeKey] ?? 0 : 0;
              const isActive = activePanel === item.panel;
              let badgeClass = "bg-white/15 text-[#F1F5F9]";
              if (item.badgeKey === "matching" || item.badgeKey === "crossref")
                badgeClass = "bg-error text-white";
              if (item.badgeKey === "style" || item.badgeKey === "claims")
                badgeClass = "bg-warning text-white";

              return (
                <button
                  key={item.panel}
                  className={`flex items-center gap-2.5 w-full text-left min-h-[44px] px-3 py-2.5 rounded-md border-none text-sm font-semibold cursor-pointer transition-all duration-150 ease mb-0.75 ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-sidebar-text hover:bg-white/10 hover:text-white"
                  }`}
                  data-panel={item.panel}
                  onClick={() => {
                    onPanelChange(item.panel);
                    if (onClose) onClose();
                  }}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={`${item.label} Panel`}
                >
                  <span
                    className={`w-[18px] h-[18px] flex-none rounded flex items-center justify-center text-[11px] ${
                      isActive
                        ? "bg-brand text-white"
                        : "bg-white/10 text-[#E2E8F0]"
                    }`}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  {item.label}
                  {item.badgeKey && badgeCount > 0 && (
                    <span
                      className={`ml-auto font-mono text-[11px] font-bold px-2 py-0.5 rounded-[10px] ${badgeClass}`}
                    >
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </aside>
    </>
  );
}
