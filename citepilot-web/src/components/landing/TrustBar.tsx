"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users, BookOpen, Sparkles } from "lucide-react";

export interface PartnerLogo {
  id: string;
  name: string;
  category: "university" | "publisher";
  shortName: string;
  subtext?: string;
}

export const PARTNERS: PartnerLogo[] = [
  { id: "mit", name: "Massachusetts Institute of Technology", shortName: "MIT", category: "university" },
  { id: "stanford", name: "Stanford University", shortName: "STANFORD", category: "university" },
  { id: "oxford", name: "University of Oxford", shortName: "OXFORD", category: "university" },
  { id: "harvard", name: "Harvard University", shortName: "HARVARD", category: "university" },
  { id: "cambridge", name: "University of Cambridge", shortName: "CAMBRIDGE", category: "university" },
  { id: "nature", name: "Nature Portfolio", shortName: "nature", subtext: "portfolio", category: "publisher" },
  { id: "ieee", name: "IEEE Xplore", shortName: "IEEE", category: "publisher" },
  { id: "springer", name: "Springer Nature", shortName: "Springer", category: "publisher" },
];

export const TRUST_METRICS = [
  {
    id: "universities",
    label: "1,200+ Universities",
    icon: GraduationCap,
  },
  {
    id: "researchers",
    label: "250,000+ Researchers",
    icon: Users,
  },
  {
    id: "citations",
    label: "12M+ Citations Audited",
    icon: BookOpen,
  },
  {
    id: "accuracy",
    label: "99.4% Accuracy",
    icon: Sparkles,
  },
];

export default function TrustBar() {
  return (
    <section
      className="w-full bg-[#f5f5f5] border-y border-[#ebebeb] py-12 sm:py-16"
      role="region"
      aria-label="Institutional Trust and Partner Logo Cloud"
      data-testid="landing-trustbar"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Social Proof Header Block */}
        <div className="text-center max-w-[800px] mx-auto mb-8 sm:mb-10">
          <Badge
            variant="outline"
            size="sm"
            className="mb-3 uppercase tracking-wider font-mono"
            data-testid="trustbar-badge"
          >
            Institutional Trust &amp; Scale
          </Badge>
          <h2
            className="font-display font-bold text-[22px] sm:text-[28px] md:text-[32px] text-[#0e101a] tracking-tight leading-[1.25]"
            data-testid="trustbar-headline"
          >
            Trusted by 250,000+ researchers across 1,200+ universities worldwide
          </h2>
          <p
            className="mt-2.5 text-[15px] sm:text-[16px] text-[#545454] leading-relaxed"
            data-testid="trustbar-subtext"
          >
            From Ivy League laboratories to global publisher workflows, leading scholars rely on
            CitePilot to verify citation integrity.
          </p>

          {/* Social Proof Metric Chips */}
          <div
            className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mt-5"
            data-testid="trustbar-metrics"
          >
            {TRUST_METRICS.map((metric) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.id}
                  data-testid={`trustbar-chip-${metric.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-[#d9d9d9] text-[12px] font-mono font-semibold text-[#0e101a] shadow-none"
                >
                  <Icon className="w-3.5 h-3.5 text-[#027e6f]" aria-hidden="true" />
                  <span>{metric.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 8-Partner Logo Cloud Grid */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 sm:gap-6 items-center justify-items-center pt-6 border-t border-[#ebebeb]"
          data-testid="trustbar-logo-cloud"
        >
          {PARTNERS.map((partner) => (
            <div
              key={partner.id}
              data-testid={`partner-logo-${partner.id}`}
              className="w-full h-16 sm:h-20 flex flex-col items-center justify-center rounded-[8px] bg-white border border-[#ebebeb] px-3 py-2 text-center transition-all duration-150 hover:border-[#d9d9d9] group select-none shadow-none"
              aria-label={`Partner: ${partner.name}`}
            >
              <span className="font-display font-extrabold text-[15px] sm:text-[16px] tracking-tight text-[#707070] group-hover:text-[#0e101a] transition-colors">
                {partner.shortName}
              </span>
              {partner.subtext && (
                <span className="text-[10px] font-sans font-medium text-[#707070] -mt-0.5 tracking-widest uppercase">
                  {partner.subtext}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
