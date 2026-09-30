"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

export default function EnterpriseBand() {
  return (
    <section
      className="w-full bg-[#2c3e8c] text-white py-20 sm:py-24 md:py-28 relative overflow-hidden"
      id="enterprise"
      role="region"
      aria-label="CitePilot for institutions"
      data-testid="landing-enterprise-band"
    >
      {/* Background Concentric Hairline Geometric Pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden="true"
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-[840px] mx-auto">
          <Badge
            variant="dark"
            size="sm"
            className="mb-4 uppercase tracking-wider font-mono border-white/30 text-white"
            data-testid="enterprise-badge"
          >
            For institutions
          </Badge>

          <h2
            className="font-display font-extrabold text-[32px] sm:text-[42px] md:text-[48px] text-white tracking-tight leading-[1.15]"
            data-testid="enterprise-headline"
          >
            CitePilot for universities &amp; research groups
          </h2>

          <p
            className="mt-4 sm:mt-5 text-[16px] sm:text-[18px] text-white/90 leading-relaxed max-w-[700px] mx-auto font-sans"
            data-testid="enterprise-subtext"
          >
            Give every student and researcher the same citation checks. Manage accounts for a
            department or campus, and keep a shared view of what your teams are publishing.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mt-8 sm:mt-10"
            data-testid="enterprise-ctas"
          >
            <Button
              variant="ghost-white"
              size="lg"
              withArrow
              className="w-full sm:w-auto font-bold text-[15px] border-white hover:bg-white hover:text-[#2c3e8c] shadow-none"
              data-testid="enterprise-btn-trial"
            >
              Request institutional trial
            </Button>
            <Button
              variant="ghost-white"
              size="lg"
              leftIcon={<Calendar className="w-4 h-4" />}
              className="w-full sm:w-auto font-semibold text-[15px] border-white/50 hover:border-white shadow-none"
              data-testid="enterprise-btn-demo"
            >
              Talk to us
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
