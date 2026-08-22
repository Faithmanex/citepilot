"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { LogOut, Sparkles, Shield, ChevronDown, CheckCircle } from "lucide-react";

interface UserMenuProps {
  onOpenAuth: () => void;
  onOpenSubscription: () => void;
}

export default function UserMenu({ onOpenAuth, onOpenSubscription }: UserMenuProps) {
  const { user, profile, isPro, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenAuth}
          className="px-3.5 py-1.5 text-xs font-semibold text-[#1E5E4B] bg-[#1E5E4B]/10 hover:bg-[#1E5E4B]/20 rounded-md transition-colors cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  const displayName = profile?.name || user.email?.split("@")[0] || "Researcher";
  const userInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const tierLabel = isPro ? "Pro Member" : "Free Plan";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-black/5 transition-all text-left cursor-pointer border border-transparent hover:border-[#E0DED4]"
      >
        <div className="w-8 h-8 rounded-full bg-[#1E5E4B] text-white font-bold text-xs flex items-center justify-center shadow-xs">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            userInitials
          )}
        </div>
        <div className="hidden sm:flex flex-col">
          <span className="text-xs font-bold text-ink leading-tight truncate max-w-[120px]">
            {displayName}
          </span>
          <span
            className={`text-[10px] font-semibold leading-tight ${
              isPro ? "text-[#1E5E4B]" : "text-ink-muted"
            }`}
          >
            {tierLabel}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-ink-muted hidden sm:block" />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#E6E4DC] py-2 z-50 animate-fade-in text-ink">
          <div className="px-4 py-2 border-b border-[#F0EFE9]">
            <p className="text-xs font-bold text-ink truncate">{displayName}</p>
            <p className="text-[11px] text-ink-muted truncate">{user.email}</p>
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isPro
                    ? "bg-[#1E5E4B]/10 text-[#1E5E4B] border border-[#1E5E4B]/20"
                    : "bg-gray-100 text-gray-700 border border-gray-200"
                }`}
              >
                {isPro ? <Sparkles className="w-2.5 h-2.5 text-[#1E5E4B]" /> : <Shield className="w-2.5 h-2.5" />}
                {tierLabel}
              </span>
            </div>
          </div>

          <div className="py-1">
            {!isPro && (
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenSubscription();
                }}
                className="w-full px-4 py-2 text-left text-xs font-bold text-[#1E5E4B] hover:bg-[#1E5E4B]/10 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#1E5E4B]" />
                Upgrade to Pro (Unlimited)
              </button>
            )}

            {isPro && (
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenSubscription();
                }}
                className="w-full px-4 py-2 text-left text-xs font-medium text-ink hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <CheckCircle className="w-4 h-4 text-[#1E5E4B]" />
                Manage Subscription
              </button>
            )}

            <button
              onClick={() => {
                setDropdownOpen(false);
                signOut();
              }}
              className="w-full px-4 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
