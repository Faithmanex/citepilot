"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle, AlertTriangle } from "lucide-react";

export default function FeatureTriptych() {
  return (
    <section
      className="w-full bg-white py-16 sm:py-20 md:py-28 border-b border-[#d9cfb8]"
      id="features"
      role="region"
      aria-label="CitePilot Core Capabilities Showcase"
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
            Core Capabilities
          </Badge>
          <h2
            className="font-display font-extrabold text-[28px] sm:text-[36px] md:text-[40px] text-[#221d16] tracking-tight leading-[1.2]"
            data-testid="triptych-headline"
          >
            Precision citation intelligence for rigorous manuscripts
          </h2>
          <p
            className="mt-4 text-[16px] sm:text-[18px] text-[#5c5344] leading-relaxed"
            data-testid="triptych-subtext"
          >
            Eliminate phantom citations, verify empirical assertions, and protect your academic
            reputation before peer review.
          </p>
        </div>

        {/* 3-Card Triptych Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {/* Card 1: Citation Discovery */}
          <div
            className="flex flex-col rounded-[8px] bg-white border border-[#d9cfb8] overflow-hidden transition-all duration-200 hover:border-[#d9cfb8] shadow-none"
            data-testid="triptych-card-discovery"
          >
            {/* Visual Mockup 1 */}
            <div className="bg-[#faf6ec] border-b border-[#d9cfb8] p-4 sm:p-5 h-[230px] flex flex-col justify-center">
              <div className="bg-white border border-[#d9cfb8] rounded-[8px] p-3.5 shadow-none space-y-2.5 font-sans">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#948a76] pb-2 border-b border-[#d9cfb8]">
                  <div className="flex items-center gap-1.5 text-[#2c3e8c] font-semibold">
                    <Search className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>CrossRef Resolution</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-[4px] bg-[#e7e9f5] text-[#2c3e8c] font-bold">
                    38ms
                  </span>
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#221d16] leading-snug line-clamp-1">
                    Automated Synthesis of Nanoscale Alloys
                  </div>
                  <div className="text-[11px] text-[#948a76] mt-0.5">
                    Vasquez, H., et al. ·{" "}
                    <span className="italic font-medium text-[#221d16]">Nature</span> 618, 420–427
                    (2023)
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#2c3e8c] bg-[#e7e9f5] border border-[#c9cee8] px-2 py-0.5 rounded-[4px]">
                    <CheckCircle className="w-3 h-3" /> DOI 10.1038/s41586-023
                  </span>
                  <span className="text-[10px] font-mono text-[#5c5344] bg-[#faf6ec] px-1.5 py-0.5 rounded-[4px] border border-[#d9cfb8]">
                    APA 7 Validated
                  </span>
                </div>
              </div>
            </div>

            {/* Card Content 1 */}
            <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-5">
              <div>
                <Badge variant="teal" size="sm" className="mb-2.5 font-mono">
                  01 · CITATION DISCOVERY
                </Badge>
                <h3 className="font-display font-bold text-[20px] sm:text-[22px] text-[#221d16] tracking-tight leading-snug mb-2.5">
                  Real-Time CrossRef &amp; Semantic Scholar Resolution
                </h3>
                <p className="text-[14.5px] text-[#5c5344] leading-[1.6]">
                  Instantly match every in-text citation and bibliography entry against 150M+
                  verified academic records. Auto-complete missing DOIs, fix truncated author lists,
                  and standardize metadata in milliseconds.
                </p>
              </div>

              {/* Feature Bullets */}
              <div className="pt-4 border-t border-[#d9cfb8] space-y-2 font-sans text-[13px] text-[#221d16]">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#2c3e8c] flex-none" />
                  <span>150M+ DOIs &amp; CrossRef metadata sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#2c3e8c] flex-none" />
                  <span>Missing volume, issue, and author repair</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#2c3e8c] flex-none" />
                  <span>Universal citation style auto-conversion</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Claim Verification */}
          <div
            className="flex flex-col rounded-[8px] bg-white border border-[#d9cfb8] overflow-hidden transition-all duration-200 hover:border-[#d9cfb8] shadow-none"
            data-testid="triptych-card-verification"
          >
            {/* Visual Mockup 2 */}
            <div className="bg-[#faf6ec] border-b border-[#d9cfb8] p-4 sm:p-5 h-[230px] flex flex-col justify-center">
              <div className="bg-white border border-[#d9cfb8] rounded-[8px] p-3.5 shadow-none space-y-2.5 font-sans">
                <div className="text-[11.5px] text-[#221d16] leading-relaxed bg-[#faf6ec] p-2 rounded-[6px] border border-[#d9cfb8]">
                  &ldquo;...cohort showed a{" "}
                  <span className="bg-[#f1e4c8] text-[#93650f] font-bold px-1 rounded border border-[#ecd9a8]">
                    42.8% reduction
                  </span>{" "}
                  in complication rates (p &lt; 0.001)...&rdquo;
                </div>
                <div className="bg-[#f1e4c8]/60 border border-[#ecd9a8] rounded-[6px] p-2.5 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#93650f]">
                    <span>Assertion Check: Confirmed</span>
                    <span className="font-mono text-[10px]">100% Concordance</span>
                  </div>
                  <div className="text-[10.5px] text-[#93650f]/90 font-mono">
                    Source: Okafor et al. (2019), Table 3, p. 112
                  </div>
                </div>
              </div>
            </div>

            {/* Card Content 2 */}
            <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-5">
              <div>
                <Badge variant="amber" size="sm" className="mb-2.5 font-mono">
                  02 · CLAIM VERIFICATION
                </Badge>
                <h3 className="font-display font-bold text-[20px] sm:text-[22px] text-[#221d16] tracking-tight leading-snug mb-2.5">
                  Automated Numerical &amp; Fact-Checking Validation
                </h3>
                <p className="text-[14.5px] text-[#5c5344] leading-[1.6]">
                  Ensure quantitative assertions and causal statements match the cited literature.
                  CitePilot extracts empirical claims, cross-references underlying datasets, and flags
                  discrepancy risks before peer reviewers catch them.
                </p>
              </div>

              {/* Feature Bullets */}
              <div className="pt-4 border-t border-[#d9cfb8] space-y-2 font-sans text-[13px] text-[#221d16]">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#93650f] flex-none" />
                  <span>Numerical percentage &amp; p-value concordance</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#93650f] flex-none" />
                  <span>Causal statement vs. correlation auditing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#93650f] flex-none" />
                  <span>Direct source quotation &amp; table extractor</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Source Quality Auditing */}
          <div
            className="flex flex-col rounded-[8px] bg-white border border-[#d9cfb8] overflow-hidden transition-all duration-200 hover:border-[#d9cfb8] shadow-none"
            data-testid="triptych-card-auditing"
          >
            {/* Visual Mockup 3 */}
            <div className="bg-[#faf6ec] border-b border-[#d9cfb8] p-4 sm:p-5 h-[230px] flex flex-col justify-center">
              <div className="bg-white border border-[#d9cfb8] rounded-[8px] p-3.5 shadow-none space-y-2 font-sans">
                <div className="bg-[#f3dcd6] border border-[#ddb3aa] rounded-[6px] p-2.5 text-[#a32b21] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 flex-none" />
                    <span>RETRACTION WATCH ALERT</span>
                  </div>
                  <div className="text-[10.5px] leading-tight">
                    Hansen et al. (2021) — <span className="font-semibold">Retracted May 2024</span>
                  </div>
                </div>
                <div className="bg-[#e7e9f5] border border-[#c9cee8] rounded-[6px] p-2 text-[10.5px] text-[#2c3e8c]">
                  <span className="font-bold block">Recommended Safe Alternative:</span>
                  <span>Vance et al. (2023), Nature Cell Bio · Verified Clean</span>
                </div>
              </div>
            </div>

            {/* Card Content 3 */}
            <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-5">
              <div>
                <Badge variant="red" size="sm" className="mb-2.5 font-mono">
                  03 · SOURCE QUALITY AUDITING
                </Badge>
                <h3 className="font-display font-bold text-[20px] sm:text-[22px] text-[#221d16] tracking-tight leading-snug mb-2.5">
                  Retraction Watch Alerts &amp; Journal Integrity Scoring
                </h3>
                <p className="text-[14.5px] text-[#5c5344] leading-[1.6]">
                  Protect research credibility with continuous scanning against the Retraction Watch
                  database, predatory publisher registries, and stale citation models. Receive
                  alerts when cited works are contested or withdrawn.
                </p>
              </div>

              {/* Feature Bullets */}
              <div className="pt-4 border-t border-[#d9cfb8] space-y-2 font-sans text-[13px] text-[#221d16]">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#a32b21] flex-none" />
                  <span>Live Retraction Watch database integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#a32b21] flex-none" />
                  <span>Predatory journal &amp; hijacked title blacklist</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#a32b21] flex-none" />
                  <span>Literature freshness &amp; recency scoring</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
