"use client";

import Testimonials from "@/components/landing/Testimonials";
import FAQ from "@/components/landing/FAQ";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import WhyItMatters from "@/components/landing/WhyItMatters";
import HowItWorks from "@/components/landing/HowItWorks";
import CitationStyles from "@/components/landing/CitationStyles";
import WhoItsFor from "@/components/landing/WhoItsFor";
import SubscriptionSection from "@/components/landing/SubscriptionSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default function LandingViewWithExtras() {
  return (
    <div role="region" aria-label="CitePilot Landing Page">
      <Header />
      <Hero />
      <WhyItMatters />
      <HowItWorks />
      <CitationStyles />
      <WhoItsFor />
      <Testimonials />
      <SubscriptionSection />
      <FAQ />
      <CTASection />
      <Footer />
    </div>
  );
}
