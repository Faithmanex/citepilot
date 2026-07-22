"use client";

interface ToastProps {
  message: string;
  visible: boolean;
}

export default function Toast({ message, visible }: ToastProps) {
  return (
    <div
      id="toast"
      className={`fixed bottom-6 right-7 bg-ink text-white px-5 py-3.5 rounded-lg text-[13.5px] font-bold flex items-center gap-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.25)] z-200 transition-all duration-300 ease ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-5 opacity-0 pointer-events-none"
      }`}
      role="status"
      aria-live="polite"
    >
      <span className="w-2 h-2 rounded-full bg-verified" aria-hidden="true" />
      <span id="toast-msg">{message}</span>
    </div>
  );
}
