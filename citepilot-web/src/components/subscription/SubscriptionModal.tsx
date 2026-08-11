"use client";

import { useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import PayPalSubscriptionButton from "./PayPalSubscriptionButton";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const [subscribed, setSubscribed] = useState(false);

  if (!isOpen) return null;

  const handleSuccess = (subscriptionId: string) => {
    // Store subscription state in sessionStorage (sessionless — no backend auth)
    if (typeof window !== "undefined") {
      sessionStorage.setItem("citepilot_pro", "true");
      sessionStorage.setItem("citepilot_sub_id", subscriptionId);
    }
    setSubscribed(true);
  };

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
          <X className="w-5 h-5" />
        </button>

        {subscribed ? (
          /* Success State */
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-[#DEE8DD] border-2 border-[#1E5E4B] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#1E5E4B]" />
            </div>
            <h3 className="text-2xl font-black text-ink mb-2">You&apos;re now on Professional!</h3>
            <p className="text-ink-soft text-sm font-medium mb-6">
              Your CitePilot Professional subscription is active. Enjoy unlimited audits, all citation styles, and DOCX/PDF export.
            </p>
            <button
              onClick={onClose}
              className="btn btn-primary w-full"
            >
              Start Auditing
            </button>
          </div>
        ) : (
          /* Upgrade State */
          <>
            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 rounded-full bg-brand/10 text-brand border border-brand/30 font-extrabold text-xs uppercase tracking-wider mb-2">
                CitePilot Professional — $12.99/month
              </span>
              <h3 id="subscription-modal-title" className="text-2xl font-black text-ink">
                Upgrade to CitePilot Professional
              </h3>
              <p className="text-sm text-ink-soft mt-1 font-medium">
                Unlock unlimited manuscript verification & style rule inspection
              </p>
            </div>

            <div className="space-y-3 mb-6 bg-paper-card p-4 rounded-xl border-2 border-rule text-xs sm:text-sm font-medium">
              {[
                "Unlimited Manuscript & Reference audits",
                "Cross-verification with Crossref metadata & retraction flags",
                "Detailed style violation warnings & citation guidance",
                "Export annotated DOCX & PDF Diagnostic Reports",
                "Priority Processing & Email Support",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-ink">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-none" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="text-center mb-4">
              <p className="text-xs font-bold text-ink-soft uppercase tracking-wider mb-2">
                Complete Subscription via PayPal
              </p>
              <PayPalSubscriptionButton onSuccess={handleSuccess} />
            </div>

            <div className="text-center pt-2">
              <button
                onClick={onClose}
                className="text-xs text-ink-soft hover:text-ink font-bold underline"
              >
                Continue using free tier for now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
