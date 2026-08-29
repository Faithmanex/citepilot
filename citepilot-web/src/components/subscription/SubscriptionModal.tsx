"use client";

import { useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import PayPalSubscriptionButton from "./PayPalSubscriptionButton";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [subscribed, setSubscribed] = useState(false);

  if (!isOpen) return null;

  const handleSuccess = (_subscriptionId: string) => {
    refreshProfile();
    setSubscribed(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscription-modal-title"
    >
      <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg max-w-lg w-full p-6 sm:p-8 shadow-none relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#707070] hover:text-[#0e101a] w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f5f5f5] transition-colors"
          aria-label="Close subscription modal"
        >
          <X className="w-5 h-5" />
        </button>

        {subscribed ? (
          /* Success State */
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-[#e6f4f2] border border-[#a7dcd4] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#027e6f]" />
            </div>
            <h3 className="text-2xl font-extrabold text-[#0e101a] font-display mb-2">You&apos;re now on Professional!</h3>
            <p className="text-[#545454] text-sm font-medium mb-6">
              Your CitePilot Professional subscription is active. Enjoy unlimited audits, all citation styles, and DOCX/PDF export.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-[#027e6f] hover:bg-[#02665a] text-white text-sm font-semibold rounded-lg shadow-none cursor-pointer"
            >
              Start Auditing
            </button>
          </div>
        ) : (
          /* Upgrade State */
          <>
            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 rounded-[4px] bg-[#e6f4f2] text-[#027e6f] border border-[#a7dcd4] font-bold text-xs uppercase tracking-wider mb-2 font-mono">
                CitePilot Professional — $12.99/month
              </span>
              <h3 id="subscription-modal-title" className="text-2xl font-extrabold text-[#0e101a] font-display">
                Upgrade to CitePilot Professional
              </h3>
              <p className="text-sm text-[#545454] mt-1 font-medium">
                Unlock unlimited manuscript verification & style rule inspection
              </p>
            </div>

            <div className="space-y-3 mb-6 bg-[#f5f5f5] p-4 rounded-lg border border-[#ebebeb] text-xs sm:text-sm font-medium">
              {[
                "Unlimited Manuscript & Reference audits",
                "Cross-verification with Crossref metadata & retraction flags",
                "Detailed style violation warnings & citation guidance",
                "Export annotated DOCX & PDF Diagnostic Reports",
                "Priority Processing & Email Support",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-[#0e101a]">
                  <CheckCircle2 className="w-4 h-4 text-[#027e6f] flex-none" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="text-center mb-4">
              <p className="text-xs font-bold text-[#707070] uppercase tracking-wider mb-2 font-mono">
                Complete Subscription via PayPal
              </p>
              <PayPalSubscriptionButton
                customId={profile?.id || user?.id}
                onSuccess={handleSuccess}
              />
            </div>

            <div className="text-center pt-2">
              <button
                onClick={onClose}
                className="text-xs text-[#707070] hover:text-[#0e101a] font-bold underline cursor-pointer"
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
