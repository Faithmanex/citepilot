"use client";

import React from "react";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import FeatureTriptych from "@/components/landing/FeatureTriptych";
import HowItWorks from "@/components/landing/HowItWorks";
import CitationStyles from "@/components/landing/CitationStyles";
import EnterpriseBand from "@/components/landing/EnterpriseBand";
import Testimonials from "@/components/landing/Testimonials";
import SubscriptionSection from "@/components/landing/SubscriptionSection";
import FAQ from "@/components/landing/FAQ";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import CookieConsent from "@/components/landing/CookieConsent";

export default function LandingView() {
  return (
    <div
      role="region"
      aria-label="CitePilot Landing Page"
      data-testid="landing-view"
      className="min-h-screen bg-[#f1ebdc] text-[#221d16] flex flex-col font-sans selection:bg-[#e7e9f5] selection:text-[#2c3e8c]"
    >
      {/* 1. 64px Sticky Top Navigation */}
      <Header />

      {/* 2. Main Landmark Content */}
      <main id="main-content" className="flex-1 w-full flex flex-col">
        {/* Editorial Hero Block with Embedded Live Demo */}
        <Hero />

        {/* Core Capabilities 3-Card Triptych Grid */}
        <FeatureTriptych />

        {/* Workflow Steps */}
        <HowItWorks />

        {/* Citation Styles Showcase */}
        <CitationStyles />

        {/* Full-Bleed Enterprise Teal Band */}
        <EnterpriseBand />

        {/* Social Proof Testimonials */}
        <Testimonials />

        {/* Pricing & Subscription Tier Matrix */}
        <SubscriptionSection />

        {/* Frequently Asked Questions */}
        <FAQ />

        {/* Final Conversion CTA */}
        <CTASection />
      </main>

      {/* 3. 5-Column Dark Ink Editorial Footer */}
      <Footer />

      {/* 4. Fixed Floating Cookie & Privacy Consent Banner */}
      <CookieConsent />
    </div>
  );
}
