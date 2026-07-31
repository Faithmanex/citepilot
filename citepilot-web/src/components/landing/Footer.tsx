"use client";

import BrandLogo from "../brand/BrandLogo";

export default function Footer() {
  return (
    <footer className="border-t-2 border-rule py-8 bg-paper">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-ink-soft">
        <BrandLogo variant="light" size="sm" />
        <span className="text-center sm:text-left">
          Academic Manuscript Citation &amp; Reference Audit Platform.
        </span>
        <span className="font-mono text-ink-faint">v2.0 (2026)</span>
      </div>
    </footer>
  );
}
