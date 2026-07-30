"use client";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-10 border-t border-slate-900">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-[10px] font-black">
            CP
          </span>
          <span className="text-slate-300 font-sans font-semibold">
            CitePilot — Academic Citation &amp; Reference Verification Platform
          </span>
        </div>
        <div className="text-slate-500">
          CitePilot Enterprise Platform v2.0.0
        </div>
      </div>
    </footer>
  );
}
