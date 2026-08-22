"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { Shield, Settings2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface CookiePreferences {
  essential: true;
  performance: boolean;
  preferences: boolean;
  timestamp: number;
}

export const COOKIE_CONSENT_KEY = "cp_consent";
export const COOKIE_SETTINGS_KEY = "cp_consent_settings";
export const OPEN_COOKIE_SETTINGS_EVENT = "citepilot:open-cookie-settings";

const emptySubscribe = () => () => {};

export default function CookieConsent() {
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return !localStorage.getItem(COOKIE_CONSENT_KEY);
    } catch {
      return true;
    }
  });

  const [isCustomizing, setIsCustomizing] = useState(false);

  const [performanceEnabled, setPerformanceEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const stored = localStorage.getItem(COOKIE_SETTINGS_KEY);
      if (stored) {
        const parsed: CookiePreferences = JSON.parse(stored);
        return parsed.performance ?? true;
      }
    } catch {
      // fallback
    }
    return true;
  });

  const [preferencesEnabled, setPreferencesEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const stored = localStorage.getItem(COOKIE_SETTINGS_KEY);
      if (stored) {
        const parsed: CookiePreferences = JSON.parse(stored);
        return parsed.preferences ?? true;
      }
    } catch {
      // fallback
    }
    return true;
  });

  useEffect(() => {
    const handleOpenSettings = () => {
      setIsCustomizing(true);
      setIsVisible(true);
    };

    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, handleOpenSettings);
    return () => {
      window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, handleOpenSettings);
    };
  }, []);

  const savePreferences = (
    consentType: "accepted" | "essential" | "custom",
    prefs: CookiePreferences
  ) => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, consentType);
      localStorage.setItem(COOKIE_SETTINGS_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore write errors in restrictive environments
    }
    setIsVisible(false);
    setIsCustomizing(false);
  };

  const handleAcceptAll = () => {
    savePreferences("accepted", {
      essential: true,
      performance: true,
      preferences: true,
      timestamp: Date.now(),
    });
  };

  const handleEssentialOnly = () => {
    savePreferences("essential", {
      essential: true,
      performance: false,
      preferences: false,
      timestamp: Date.now(),
    });
  };

  const handleSaveCustom = () => {
    savePreferences("custom", {
      essential: true,
      performance: performanceEnabled,
      preferences: preferencesEnabled,
      timestamp: Date.now(),
    });
  };

  if (!isHydrated || !isVisible) {
    return null;
  }

  return (
    <aside
      aria-label="Cookie & Privacy Consent"
      data-testid="cookie-consent-banner"
      className="fixed bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 md:left-auto md:right-8 md:max-w-xl z-50 bg-[#ffffff] border border-[#d9d9d9] rounded-[8px] shadow-none p-5 text-left font-sans animate-slide-up"
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[6px] bg-[#e6f4f2] text-[#027e6f] border border-[#a7dcd4] flex items-center justify-center flex-none">
            <Shield className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
          <h3 className="font-display font-bold text-sm sm:text-base text-[#0e101a] tracking-tight">
            Privacy &amp; Academic Integrity
          </h3>
        </div>

        <button
          type="button"
          onClick={handleEssentialOnly}
          className="text-[#707070] hover:text-[#0e101a] p-1 rounded hover:bg-[#f5f5f5] transition-colors cursor-pointer"
          aria-label="Dismiss cookie notice with essential cookies only"
          data-testid="cookie-btn-dismiss"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <p className="text-xs sm:text-[13px] text-[#545454] leading-relaxed mb-4">
        We use essential cookies to maintain session integrity and anonymized telemetry to improve
        citation retrieval accuracy. We never sell academic manuscript data or train generative
        models on unpublished manuscripts. Compliant with GDPR, CCPA, and FERPA standards.{" "}
        <Link href="/cookie-policy" className="text-[#027e6f] hover:underline font-medium">
          Cookie Policy
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-[#027e6f] hover:underline font-medium">
          Privacy Policy
        </Link>
        .
      </p>

      {/* Customizable Preferences Expanded Drawer */}
      {isCustomizing && (
        <div
          data-testid="cookie-custom-drawer"
          className="mb-4 pt-3 pb-2 border-t border-b border-[#ebebeb] space-y-3"
        >
          {/* Strictly Necessary */}
          <div className="flex items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-[#0e101a]">Strictly Necessary</div>
              <div className="text-[#707070] text-[11px]">
                Session and security tokens required for manuscript auditing.
              </div>
            </div>
            <Badge variant="teal" size="sm" fontMono className="flex-none">
              Always Active
            </Badge>
          </div>

          {/* Academic Performance & Telemetry */}
          <div className="flex items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-[#0e101a]">Academic Performance &amp; Telemetry</div>
              <div className="text-[#707070] text-[11px]">
                Anonymized query latency and citation accuracy telemetry.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-none">
              <input
                type="checkbox"
                checked={performanceEnabled}
                onChange={(e) => setPerformanceEnabled(e.target.checked)}
                className="sr-only peer"
                data-testid="cookie-toggle-performance"
              />
              <div className="w-9 h-5 bg-[#d9d9d9] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#027e6f]"></div>
            </label>
          </div>

          {/* Interface Preferences */}
          <div className="flex items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-[#0e101a]">Interface Preferences</div>
              <div className="text-[#707070] text-[11px]">
                Stores citation style (APA/MLA/Chicago) and theme on your device.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-none">
              <input
                type="checkbox"
                checked={preferencesEnabled}
                onChange={(e) => setPreferencesEnabled(e.target.checked)}
                className="sr-only peer"
                data-testid="cookie-toggle-preferences"
              />
              <div className="w-9 h-5 bg-[#d9d9d9] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#027e6f]"></div>
            </label>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {!isCustomizing ? (
          <>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleAcceptAll}
                data-testid="cookie-btn-accept-all"
              >
                Accept All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEssentialOnly}
                data-testid="cookie-btn-essential"
                className="border border-[#d9d9d9] text-[#0e101a] hover:bg-[#f5f5f5]"
              >
                Essential Only
              </Button>
            </div>
            <button
              type="button"
              onClick={() => setIsCustomizing(true)}
              className="inline-flex items-center gap-1 text-xs text-[#707070] hover:text-[#0e101a] font-semibold py-1.5 px-2 rounded hover:bg-[#f5f5f5] transition-colors cursor-pointer"
              data-testid="cookie-btn-customise"
            >
              <Settings2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Customise</span>
            </button>
          </>
        ) : (
          <div className="flex items-center justify-between w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCustomizing(false)}
              data-testid="cookie-btn-back"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveCustom}
              leftIcon={<Check className="w-3.5 h-3.5" />}
              data-testid="cookie-btn-save-custom"
            >
              Save Preferences
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
