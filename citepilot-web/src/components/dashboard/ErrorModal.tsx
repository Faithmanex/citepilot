"use client";

interface ErrorModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export default function ErrorModal({
  visible,
  title,
  message,
  onClose,
}: ErrorModalProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-300 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="error-modal-title"
    >
      <div className="bg-card border-2 border-error rounded-lg max-w-[520px] w-[90%] p-6 shadow-[0_10px_25px_rgba(0,0,0,0.3)]">
        <h2
          id="error-modal-title"
          className="text-error mt-0 text-lg flex items-center gap-2"
        >
          <i className="fas fa-exclamation-triangle" aria-hidden="true" />{" "}
          {title}
        </h2>
        <p
          tabIndex={0}
          className="text-[13.5px] text-dash-ink leading-[1.5] my-4 max-h-[220px] overflow-y-auto font-mono bg-dash-paper p-3 rounded-[4px] border border-line whitespace-pre-wrap"
        >
          {message}
        </p>
        <div className="text-right">
          <button
            className="btn-dash"
            style={{ background: "var(--color-dash-ink)", borderColor: "var(--color-dash-ink)" }}
            onClick={onClose}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
