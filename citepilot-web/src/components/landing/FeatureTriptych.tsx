"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle, ShieldCheck } from "lucide-react";

interface Capability {
  id: string;
  icon: React.ElementType;
  badgeLabel: string;
  badgeVariant: "teal" | "amber" | "red";
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  bullets: string[];
}

const CAPABILITIES: Capability[] = [
  {
    id: "discovery",
    icon: Search,
    badgeLabel: "01 · CITATIONS",
    badgeVariant: "teal",
    iconColor: "#2c3e8c",
    iconBg: "#e7e9f5",
    title: "Check every citation against your reference list",
    description:
      "CitePilot matches each in-text citation to an entry in your reference list, and checks your reference entries against Crossref and OpenAlex records.",
    bullets: [
      "Flags in-text citations with no matching reference",
      "Reports year, title, and DOI differences from the record",
      "Checks formatting against your chosen style (APA, MLA, IEEE, and more)",
    ],
  },
  {
    id: "verification",
    icon: AlertTriangle,
    badgeLabel: "02 · CLAIMS",
    badgeVariant: "amber",
    iconColor: "#93650f",
    iconBg: "#f1e4c8",
    title: "Find claims that need a source",
    description:
      "CitePilot reads your text and flags factual, historical, and statistical statements that are asserted without a citation, pointing to the exact sentence.",
    bullets: [
      "Detects empirical and statistical claims without a source",
      "Points to the paragraph and sentence",
      "Suggests where a citation marker belongs",
    ],
  },
  {
    id: "auditing",
    icon: ShieldCheck,
    badgeLabel: "03 · REFERENCES",
    badgeVariant: "red",
    iconColor: "#a32b21",
    iconBg: "#f3dcd6",
    title: "Check sources for retraction and reuse",
    description:
      "Cited works are checked for retraction and expression-of-concern notices, and every reference-list entry is checked to see whether it is actually cited.",
    bullets: [
      "Retraction and expression-of-concern checks via Crossref",
      "Finds reference-list entries that are never cited",
      "Reports the age distribution of your sources",
    ],
  },
];

export default function FeatureTriptych() {
  return (
    <section
      className="w-full bg-white py-16 sm:py-20 md:py-28 border-b border-[#d9cfb8]"
      id="features"
      role="region"
      aria-label="What CitePilot checks"
      data-testid="landing-feature-triptych"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-[760px] mx-auto mb-12 sm:mb-16">
          <Badge
            variant="teal"
            size="sm"
            className="mb-3 uppercase tracking-wider font-mono"
            data-testid="triptych-badge"
          >
            What CitePilot checks
          </Badge>
          <h2
            className="font-display font-extrabold text-[28px] sm:text-[36px] md:text-[40px] text-[#221d16] tracking-tight leading-[1.2]"
            data-testid="triptych-headline"
          >
            Specific findings you can act on
          </h2>
          <p
            className="mt-4 text-[16px] sm:text-[18px] text-[#5c5344] leading-relaxed"
            data-testid="triptych-subtext"
          >
            Every audit lists the exact citation, claim, and reference problems it found — with a
            suggested fix for each, and no score to interpret.
          </p>
        </div>

        {/* 3-Card Triptych Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {CAPABILITIES.map((capability) => {
            const Icon = capability.icon;
            return (
              <div
                key={capability.id}
                className="flex flex-col rounded-[8px] bg-white border border-[#d9cfb8] overflow-hidden transition-all duration-200 hover:border-[#d9cfb8] shadow-none"
                data-testid={`triptych-card-${capability.id}`}
              >
                {/* Icon header */}
                <div className="bg-[#faf6ec] border-b border-[#d9cfb8] p-6 flex items-center gap-3">
                  <span
                    className="w-10 h-10 rounded-[8px] flex items-center justify-center flex-none"
                    style={{ backgroundColor: capability.iconBg }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: capability.iconColor }}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-[12px] font-mono font-bold tracking-wider text-[#5c5344]">
                    {capability.badgeLabel}
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-5">
                  <div>
                    <h3 className="font-display font-bold text-[20px] sm:text-[22px] text-[#221d16] tracking-tight leading-snug mb-2.5">
                      {capability.title}
                    </h3>
                    <p className="text-[14.5px] text-[#5c5344] leading-[1.6]">
                      {capability.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#d9cfb8] space-y-2 font-sans text-[13px] text-[#221d16]">
                    {capability.bullets.map((bullet) => (
                      <div key={bullet} className="flex items-start gap-2">
                        <span
                          className="w-1.5 h-1.5 rounded-full mt-1.5 flex-none"
                          style={{ backgroundColor: capability.iconColor }}
                          aria-hidden="true"
                        />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
