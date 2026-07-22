"use client";

import { useState, useCallback, useEffect } from "react";
import LandingView from "@/components/landing/LandingView";
import DashboardView from "@/components/dashboard/DashboardView";

export default function Home() {
  const [view, setView] = useState<"landing" | "dashboard">("landing");

  const handleLaunchApp = useCallback(() => {
    setView("dashboard");
  }, []);

  const handleBackToLanding = useCallback(() => {
    setView("landing");
  }, []);

  useEffect(() => {
    if (view === "dashboard") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [view]);

  return (
    <>
      {view === "landing" && <LandingView onLaunchApp={handleLaunchApp} />}
      {view === "dashboard" && (
        <>
          <button
            className="btn btn-ghost"
            id="btn-toggle-landing"
            onClick={handleBackToLanding}
            aria-label="View Landing Page"
            style={{
              position: "fixed",
              top: 14,
              right: 24,
              zIndex: 200,
              background: "var(--color-paper-card)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              fontSize: 13,
              padding: "8px 16px",
              minHeight: 40,
            }}
          >
            <i className="fas fa-arrow-left" aria-hidden="true" /> Landing Page
          </button>
          <DashboardView />
        </>
      )}
    </>
  );
}
