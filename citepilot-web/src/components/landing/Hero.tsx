"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { InteractiveDemoEditor } from "@/components/landing/demo";

export default function Hero() {
  const router = useRouter();

  const handleExploreDemo = () => {
    const demoElement = document.getElementById("live-demo-showcase");
    if (demoElement) {
      demoElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      className="pt-12 sm:pt-16 md:pt-20 pb-16 sm:pb-20 md:pb-24 border-b border-[#ebebeb] bg-[#ffffff] relative overflow-hidden"
      role="region"
      aria-label="CitePilot Hero and Interactive Demo"
      data-testid="landing-hero"
    >
      <Container size="default" className="flex flex-col items-center text-center">
        {/* Top Eyebrow Tag */}
        <Badge
          variant="teal"
          size="md"
          dot
          fontMono
          uppercase
          className="mb-4 sm:mb-6"
          data-testid="hero-badge"
        >
          Academic Manuscript Integrity Engine
        </Badge>

        {/* Display Headline in Manrope */}
        <h1
          className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl lg:text-[64px] leading-[1.08] tracking-[-0.0100em] text-[#0e101a] max-w-4xl mx-auto"
          data-testid="hero-headline"
        >
          Write with absolute <br className="hidden sm:inline" />
          <span className="text-[#027e6f]">academic confidence.</span>
        </h1>

        {/* Centered Editorial Subtext */}
        <p
          className="mt-4 sm:mt-6 font-sans text-base sm:text-lg md:text-xl leading-relaxed text-[#4d536e] max-w-2xl mx-auto"
          data-testid="hero-subtext"
        >
          CitePilot audits manuscripts in real time for missing references, unsupported claims, and
          retracted sources — ensuring every citation stands up to peer review.
        </p>

        {/* Dual CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
          <Button
            variant="primary"
            size="lg"
            withArrow
            onClick={() => router.push("/dashboard")}
            className="w-full sm:w-auto font-display font-bold text-base"
            aria-label="Get CitePilot — it's free"
            data-testid="hero-btn-primary"
          >
            Get CitePilot — it&apos;s free
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={handleExploreDemo}
            className="w-full sm:w-auto font-display font-semibold text-base"
            aria-label="Explore live interactive demo"
            data-testid="hero-btn-demo"
          >
            Explore live demo
          </Button>
        </div>

        {/* Legal Microcopy */}
        <div
          className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs text-[#707070] font-medium tracking-tight"
          data-testid="hero-microcopy"
        >
          <span>Free for individual researchers</span>
          <span className="text-[#b7b7b7]">•</span>
          <span>No credit card required</span>
          <span className="text-[#b7b7b7]">•</span>
          <span>GDPR &amp; FERPA compliant</span>
        </div>

        {/* Live Interactive Demo Embedding Showcase */}
        <div
          id="live-demo-showcase"
          className="mt-12 sm:mt-16 w-full max-w-[1200px] text-left"
          data-testid="hero-demo-container"
        >
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#f5f5f5] border border-b-0 border-[#d9d9d9] rounded-t-lg text-xs font-mono font-semibold text-[#545454]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-[3px] bg-[#027e6f] inline-block" />
              <span>CitePilot Live Manuscript Auditor</span>
            </div>
            <span className="text-[#707070] hidden sm:inline">Real-Time Suggestion Engine</span>
          </div>

          <div className="border border-[#d9d9d9] rounded-b-lg bg-[#ffffff] shadow-none overflow-hidden">
            <InteractiveDemoEditor defaultDraftId="lit-review" />
          </div>
        </div>
      </Container>
    </section>
  );
}
