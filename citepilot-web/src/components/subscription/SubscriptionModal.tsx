"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import PayPalSubscriptionButton from "./PayPalSubscriptionButton";
import Modal from "../ui/Modal";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [subscribed, setSubscribed] = useState(false);

  const handleSuccess = () => {
    refreshProfile();
    setSubscribed(true);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        subscribed
          ? "You're now on Professional"
          : "Upgrade to CitePilot Professional"
      }
      description={
        subscribed
          ? "Your CitePilot Professional subscription is active. Enjoy unlimited audits, all citation styles, and DOCX/PDF export."
          : "Unlock unlimited manuscript verification and style rule inspection."
      }
      bodyClassName="p-6 sm:p-8"
    >
      {subscribed ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-[#e7e9f5] border border-[#c9cee8] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#2c3e8c]" aria-hidden="true" />
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-[#2c3e8c] hover:bg-[#24357a] text-white text-sm font-semibold rounded-lg shadow-none cursor-pointer"
          >
            Start auditing
          </button>
        </div>
      ) : (
        <>
          <p className="inline-block px-3 py-1 rounded-[4px] bg-[#e7e9f5] text-[#2c3e8c] border border-[#c9cee8] font-bold text-xs uppercase tracking-wider mb-4 font-mono">
            CitePilot Professional — $12.99/month
          </p>

          <ul className="space-y-3 mb-6 bg-[#faf6ec] p-4 rounded-lg border border-[#d9cfb8] text-xs sm:text-sm font-medium">
            {[
              "Unlimited manuscript and reference audits",
              "Crossref metadata checks and retraction flags",
              "Style violation warnings and citation guidance",
              "Annotated DOCX and PDF diagnostic exports",
              "Email support",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-[#221d16]">
                <CheckCircle2 className="w-4 h-4 text-[#2c3e8c] flex-none" aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="text-center mb-4">
            <p className="text-xs font-bold text-[#5c5344] uppercase tracking-wider mb-2 font-mono">
              Complete subscription via PayPal
            </p>
            <PayPalSubscriptionButton
              customId={profile?.id || user?.id}
              onSuccess={handleSuccess}
            />
          </div>

          <div className="text-center pt-2">
            <button
              onClick={onClose}
              className="text-xs text-[#5c5344] hover:text-[#221d16] font-bold underline cursor-pointer"
            >
              Continue using the free tier for now
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
