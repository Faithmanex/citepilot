"use client";

import Header from "./Header";
import Hero from "./Hero";
import WhyItMatters from "./WhyItMatters";
import HowItWorks from "./HowItWorks";
import CitationStyles from "./CitationStyles";
import WhoItsFor from "./WhoItsFor";
import SubscriptionSection from "./SubscriptionSection";
import CTASection from "./CTASection";
import Footer from "./Footer";

interface LandingViewProps {
  onLaunchApp: () => void;
}

export default function LandingView({ onLaunchApp }: LandingViewProps) {
  return (
    <div role="region" aria-label="Landing Page">
      <Header onToggleDashboard={onLaunchApp} />
      <Hero onLaunchApp={onLaunchApp} />
      <WhyItMatters />
      <HowItWorks />
      <CitationStyles />
      <WhoItsFor />
      <SubscriptionSection onLaunchApp={onLaunchApp} />
      <CTASection onLaunchApp={onLaunchApp} />
      <Footer />
    </div>
  );
}
