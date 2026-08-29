// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import fs from "fs";
import path from "path";

import OverviewPanel from "../OverviewPanel";
import MatchingPanel from "../MatchingPanel";
import CrossrefPanel from "../CrossrefPanel";
import StylePanel from "../StylePanel";
import ClaimsPanel from "../ClaimsPanel";
import RecencyPanel from "../RecencyPanel";
import StructurePanel from "../StructurePanel";
import ExportPanel from "../ExportPanel";
import type { AuditResponse } from "@/lib/types";

const mockAuditData: AuditResponse = {
  citations: [
    {
      raw_text: "(Smith, 2020)",
      paragraph_index: 0,
      status: "matched",
    },
    {
      raw_text: "(Doe, 2019)",
      paragraph_index: 1,
      status: "no_match",
      issues: [{ type: "no_match", message: "Citation not found in references" }],
    },
  ],
  references: [
    {
      raw_entry: "Smith, J. (2020). Machine Learning Advances. Journal of AI, 12(3), 45-60.",
      status: "cited",
      parsed_doi: "10.1000/182",
    },
    {
      raw_entry: "Johnson, K. (2018). Retracted Studies in Immunology. Nature Med, 5, 12-14.",
      status: "retracted",
      retraction_info: {
        how_to_fix: "Remove citation or substitute with updated replicate.",
      },
    },
  ],
  style_warnings: [
    {
      code: "STYLE-001",
      message: "Missing comma after author initial",
      target_text: "Smith J. (2020)",
      suggestion: "Smith, J. (2020)",
      educational_context: "APA 7th requires commas between surnames and initials.",
    },
  ],
  uncited_claims: [
    {
      claim_text: "78% of clinical trials in 2021 failed replication.",
      paragraph_index: 2,
      educational_context: "Specific statistical claims require direct attribution.",
    },
  ],
  recency: {
    within_3_years_count: 1,
    within_5_years_percent: 50,
    within_10_years_percent: 100,
    older_than_10_years_percent: 0,
    average_source_age_years: 5,
    recency_compliance_status: "PASSED",
  },
  structure: [
    {
      title: "Heading Hierarchy",
      message: "Headings follow standard H1 -> H2 structure.",
      status: "ok",
    },
  ],
};

describe("Dashboard Design Token & UI Synchronization Audit", () => {
  afterEach(() => {
    cleanup();
  });

  it("ensures zero legacy parchment or sepia tokens in dashboard source files", () => {
    const dashboardDir = path.resolve(__dirname, "..");
    const files = fs.readdirSync(dashboardDir).filter((f) => f.endsWith(".tsx"));

    const legacyTokens = [
      "#FAF6EC",
      "#FAF9F5",
      "#F4F3EE",
      "#F1EBDC",
      "#E8E0CE",
      "#C7BC9F",
      "#1E5E4B",
      "#221D16",
      "#353027",
    ];

    files.forEach((file) => {
      const content = fs.readFileSync(path.join(dashboardDir, file), "utf-8");
      legacyTokens.forEach((token) => {
        expect(
          content,
          `File ${file} should not contain legacy token ${token}`
        ).not.toContain(token);
      });
    });
  });

  it("ensures strict absence of drop shadow classes across all dashboard files", () => {
    const dashboardDir = path.resolve(__dirname, "..");
    const files = fs.readdirSync(dashboardDir).filter((f) => f.endsWith(".tsx"));

    const shadowRegex = /\bshadow-(sm|md|lg|xl|2xl|xs)\b/;

    files.forEach((file) => {
      const content = fs.readFileSync(path.join(dashboardDir, file), "utf-8");
      expect(
        shadowRegex.test(content),
        `File ${file} should not contain drop shadow classes`
      ).toBe(false);
    });
  });

  it("ensures strict absence of oversized rounded corners (rounded-2xl, rounded-3xl, rounded-xl) across all dashboard files", () => {
    const dashboardDir = path.resolve(__dirname, "..");
    const files = fs.readdirSync(dashboardDir).filter((f) => f.endsWith(".tsx"));

    const oversizedRadiusRegex = /\brounded-(2xl|3xl|xl)\b/;

    files.forEach((file) => {
      const content = fs.readFileSync(path.join(dashboardDir, file), "utf-8");
      expect(
        oversizedRadiusRegex.test(content),
        `File ${file} should not contain oversized rounded corners (rounded-2xl/3xl/xl)`
      ).toBe(false);
    });
  });

  it("ensures absence of heavy borders (border-2, border-3, border-4) in dashboard files", () => {
    const dashboardDir = path.resolve(__dirname, "..");
    const files = fs.readdirSync(dashboardDir).filter((f) => f.endsWith(".tsx"));

    const heavyBorderRegex = /\bborder-[2348]\b/;

    files.forEach((file) => {
      const content = fs.readFileSync(path.join(dashboardDir, file), "utf-8");
      expect(
        heavyBorderRegex.test(content),
        `File ${file} should not contain heavy borders`
      ).toBe(false);
    });
  });

  it("renders OverviewPanel with circular SVG gauge scorecard and proper tokens", () => {
    const { container } = render(<OverviewPanel data={mockAuditData} mode="full" />);

    // Circular SVG Gauge exists
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("-rotate-90");

    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBeGreaterThanOrEqual(2);
    expect(circles[0]).toHaveAttribute("r", "32");

    // Check consistency score label
    expect(screen.getByText(/Consistency Score/i)).toBeInTheDocument();

    // Check no drop shadows in DOM
    const shadowElements = container.querySelectorAll(".shadow-sm, .shadow-md, .shadow-lg, .shadow-xl");
    expect(shadowElements.length).toBe(0);
  });

  it("renders MatchingPanel with 8px radius cards and flat elevation", () => {
    const { container } = render(<MatchingPanel data={mockAuditData} />);
    expect(screen.getByText(/Citation & Reference Matching/i)).toBeInTheDocument();

    const shadowElements = container.querySelectorAll(".shadow-sm, .shadow-md, .shadow-lg, .shadow-xl");
    expect(shadowElements.length).toBe(0);
  });

  it("renders CrossrefPanel with verified and retracted status badges", () => {
    const { container } = render(<CrossrefPanel data={mockAuditData} />);
    expect(screen.getByRole("heading", { name: /Crossref Verification/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Retracted Sources/i })).toBeInTheDocument();

    const shadowElements = container.querySelectorAll(".shadow-sm, .shadow-md, .shadow-lg, .shadow-xl");
    expect(shadowElements.length).toBe(0);
  });

  it("renders StylePanel with 8px radius violations cards", () => {
    const { container } = render(<StylePanel data={mockAuditData} />);
    expect(screen.getByRole("heading", { name: /Style Rule Violations/i })).toBeInTheDocument();
    expect(screen.getByText(/Missing comma after author initial/i)).toBeInTheDocument();

    const shadowElements = container.querySelectorAll(".shadow-sm, .shadow-md, .shadow-lg, .shadow-xl");
    expect(shadowElements.length).toBe(0);
  });

  it("renders ClaimsPanel with flat border cards", () => {
    const { container } = render(<ClaimsPanel data={mockAuditData} />);
    expect(screen.getByRole("heading", { name: /Uncited Factual Claims/i })).toBeInTheDocument();
    expect(screen.getByText(/78% of clinical trials/i)).toBeInTheDocument();

    const shadowElements = container.querySelectorAll(".shadow-sm, .shadow-md, .shadow-lg, .shadow-xl");
    expect(shadowElements.length).toBe(0);
  });

  it("renders RecencyPanel with recency breakdown", () => {
    const { container } = render(<RecencyPanel data={mockAuditData} />);
    expect(screen.getByRole("heading", { name: /Source Recency Analysis/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Recency Breakdown/i })).toBeInTheDocument();

    const shadowElements = container.querySelectorAll(".shadow-sm, .shadow-md, .shadow-lg, .shadow-xl");
    expect(shadowElements.length).toBe(0);
  });

  it("renders StructurePanel with checklist items", () => {
    const { container } = render(<StructurePanel data={mockAuditData} />);
    expect(screen.getByRole("heading", { name: /Document Layout & Structure Audit/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Structure Checklist/i })).toBeInTheDocument();

    const shadowElements = container.querySelectorAll(".shadow-sm, .shadow-md, .shadow-lg, .shadow-xl");
    expect(shadowElements.length).toBe(0);
  });

  it("renders ExportPanel with action buttons and flat surfaces", () => {
    const { container } = render(<ExportPanel data={mockAuditData} manuscriptText="Sample text" />);
    expect(screen.getByRole("heading", { name: /Export Options/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download Diagnostic Report/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download Redline DOCX/i })).toBeInTheDocument();

    const shadowElements = container.querySelectorAll(".shadow-sm, .shadow-md, .shadow-lg, .shadow-xl");
    expect(shadowElements.length).toBe(0);
  });
});
