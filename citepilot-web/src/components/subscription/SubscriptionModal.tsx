"use client";

import PayPalSubscriptionButton from "./PayPalSubscriptionButton";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscription-modal-title"
    >
      <div className="bg-paper border-3 border-ink rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-soft hover:text-ink w-9 h-9 flex items-center justify-center rounded-full border-2 border-rule hover:border-ink transition-colors"
          aria-label="Close subscription modal"
        >
          <i className="fas fa-times text-base" />
        </button>

        <div className="text-center mb-6">
          <span className="inline-block px-3 py-1 rounded-full bg-brand/10 text-brand border border-brand/30 font-extrabold text-xs uppercase tracking-wider mb-2">
            CitePilot Pro Subscription
          </span>
          <h3 id="subscription-modal-title" className="text-2xl font-black text-ink">
            Upgrade to CitePilot Pro
          </h3>
          <p className="text-sm text-ink-soft mt-1 font-medium">
            Unlock unlimited manuscript verification &amp; style rule inspection
          </p>
        </div>

        <div className="space-y-3 mb-6 bg-paper-card p-4 rounded-xl border-2 border-rule text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2 text-ink">
            <i className="fas fa-check-circle text-emerald-600 text-base" />
            <span>Unlimited Manuscript &amp; Reference audits</span>
          </div>
          <div className="flex items-center gap-2 text-ink">
            <i className="fas fa-check-circle text-emerald-600 text-base" />
            <span>Cross-verification with official Crossref &amp; Retraction Watch registries</span>
          </div>
          <div className="flex items-center gap-2 text-ink">
            <i className="fas fa-check-circle text-emerald-600 text-base" />
            <span>Detailed style violation warnings &amp; citation guidance</span>
          </div>
          <div className="flex items-center gap-2 text-ink">
            <i className="fas fa-check-circle text-emerald-600 text-base" />
            <span>Export Word DOCX (with Tracked Changes) &amp; PDF Diagnostic Reports</span>
          </div>
        </div>

        <div className="text-center mb-4">
          <p className="text-xs font-bold text-ink-soft uppercase tracking-wider mb-2">
            Complete Subscription via PayPal
          </p>
          <PayPalSubscriptionButton
            onSuccess={(subId) => {
              console.log("Subscription activated:", subId);
            }}
          />
        </div>

        <div className="text-center pt-2">
          <button
            onClick={onClose}
            className="text-xs text-ink-soft hover:text-ink font-bold underline"
          >
            Continue using free tier for now
          </button>
        </div>
      </div>
    </div>
  );
}
