"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  ShieldCheck,
  Lock,
  FileText,
  Sparkles,
  Clock,
  AlertOctagon,
  Database,
} from "lucide-react";

export interface EnterpriseStat {
  metric: string;
  title: string;
  desc: string;
  icon: React.ElementType;
}

export const ENTERPRISE_STATS: EnterpriseStat[] = [
  {
    metric: "99.4%",
    title: "Citation Accuracy",
    desc: "Verified resolution across CrossRef, PubMed, OpenAlex, and 150M+ DOIs.",
    icon: Sparkles,
  },
  {
    metric: "4.2 hrs",
    title: "Saved per Paper",
    desc: "Average faculty time saved per manuscript during audit & bibliography checks.",
    icon: Clock,
  },
  {
    metric: "100%",
    title: "Retraction Risk Detection",
    desc: "Instant alerts on any retracted or contested study across 55,000+ registered entries.",
    icon: AlertOctagon,
  },
  {
    metric: "12M+",
    title: "Papers Indexed",
    desc: "Continuous corpus synchronization across 200+ scientific and humanities disciplines.",
    icon: Database,
  },
];

export default function EnterpriseBand() {
  return (
    <section
      className="w-full bg-[#027e6f] text-white py-20 sm:py-24 md:py-28 relative overflow-hidden"
      id="enterprise"
      role="region"
      aria-label="CitePilot Enterprise & Institutional Licensing"
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
        {/* Centered Headings */}
        <div className="text-center max-w-[840px] mx-auto">
          <Badge
            variant="dark"
            size="sm"
            className="mb-4 uppercase tracking-wider font-mono border-white/30 text-white"
            data-testid="enterprise-badge"
          >
            Enterprise &amp; Institutional Licensing
          </Badge>

          <h2
            className="font-display font-extrabold text-[32px] sm:text-[42px] md:text-[48px] text-white tracking-tight leading-[1.15]"
            data-testid="enterprise-headline"
          >
            CitePilot for Universities &amp; Research Labs
          </h2>

          <p
            className="mt-4 sm:mt-5 text-[16px] sm:text-[18px] text-white/90 leading-relaxed max-w-[700px] mx-auto font-sans"
            data-testid="enterprise-subtext"
          >
            Scale citation integrity across your entire campus. Empower faculty, graduate
            researchers, and academic departments with automated Retraction Watch feeds, centralized
            administrative consoles, and single sign-on.
          </p>

          {/* Dual Ghost CTAs */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mt-8 sm:mt-10"
            data-testid="enterprise-ctas"
          >
            <Button
              variant="ghost-white"
              size="lg"
              withArrow
              className="w-full sm:w-auto font-bold text-[15px] border-white hover:bg-white hover:text-[#027e6f] shadow-none"
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
              Schedule enterprise demo
            </Button>
          </div>

          <p
            className="mt-3.5 text-[12px] sm:text-[13px] text-white/70 font-mono"
            data-testid="enterprise-microcopy"
          >
            Custom pilot programs for university faculties • SAML/SSO ready • SOC2 Type II certified
          </p>
        </div>

        {/* Horizontal Row of 4 Stat Cards */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-14 sm:mt-18"
          data-testid="enterprise-stat-grid"
        >
          {ENTERPRISE_STATS.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                data-testid={`enterprise-stat-card-${idx}`}
                className="rounded-[8px] bg-white/10 border border-white/20 p-6 backdrop-blur-[2px] transition-all duration-150 hover:bg-white/15 hover:border-white/40 shadow-none text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 text-white/70">
                    <Icon className="w-5 h-5 text-white/90" aria-hidden="true" />
                    <span className="text-[11px] font-mono uppercase tracking-wider text-white/60">
                      Metric 0{idx + 1}
                    </span>
                  </div>
                  <div
                    className="font-display font-extrabold text-[36px] sm:text-[40px] text-white tracking-tight leading-none mb-2"
                    data-testid={`enterprise-stat-metric-${idx}`}
                  >
                    {stat.metric}
                  </div>
                  <div className="font-display font-bold text-[15px] sm:text-[16px] text-white mb-1.5">
                    {stat.title}
                  </div>
                </div>
                <p className="text-[13px] text-white/80 leading-normal font-sans pt-2 border-t border-white/15">
                  {stat.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Institutional Trust & Compliance Footer Badges */}
        <div
          className="mt-12 sm:mt-14 pt-6 border-t border-white/15 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-[12.5px] font-mono text-white/80"
          data-testid="enterprise-compliance-badges"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-white" aria-hidden="true" />
            <span>SAML 2.0 / Okta SSO</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-white" aria-hidden="true" />
            <span>FERPA &amp; GDPR Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-white" aria-hidden="true" />
            <span>Custom Institutional DPA &amp; SLA</span>
          </div>
        </div>
      </div>
    </section>
  );
}
