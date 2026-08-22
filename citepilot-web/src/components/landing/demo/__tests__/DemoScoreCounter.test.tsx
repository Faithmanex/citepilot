// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { DemoScoreCounter } from "../DemoScoreCounter";
import type { RigorMetrics } from "../types";

describe("DemoScoreCounter Component", () => {
  afterEach(() => {
    cleanup();
  });

  const sampleMetrics: RigorMetrics = {
    overallScore: 88,
    sourceCoverage: 85,
    claimIntegrity: 90,
    scholarlyTone: 92,
    totalCount: 4,
    unresolvedCount: 1,
    acceptedCount: 3,
    dismissedCount: 0,
    statusLabel: "Strong Academic Rigor",
    pointsGained: 24,
    deltaScore: 24,
    isOptimal: false,
  };

  it("renders 76px circular SVG gauge with score percentage", () => {
    const { container } = render(<DemoScoreCounter metrics={sampleMetrics} />);

    expect(screen.getByText("88%")).toBeInTheDocument();
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("viewBox", "0 0 76 76");
  });

  it("renders status title and pending revisions count", () => {
    render(<DemoScoreCounter metrics={sampleMetrics} />);

    expect(screen.getByText("Strong Academic Rigor")).toBeInTheDocument();
    expect(screen.getByText("1 suggested revisions pending")).toBeInTheDocument();
  });

  it("renders verified banner when all revisions are resolved", () => {
    const resolvedMetrics: RigorMetrics = {
      ...sampleMetrics,
      overallScore: 100,
      unresolvedCount: 0,
      statusLabel: "Ready for Journal Submission",
      isOptimal: true,
    };

    render(<DemoScoreCounter metrics={resolvedMetrics} />);

    expect(screen.getByText("Ready for Journal Submission")).toBeInTheDocument();
    expect(screen.getByText(/all citations verified and aligned/i)).toBeInTheDocument();
  });

  it("renders 3 sub-metric score tiles with 8px radius and zero shadows", () => {
    render(<DemoScoreCounter metrics={sampleMetrics} />);

    const covTile = screen.getByTestId("metric-tile-source-coverage");
    const intTile = screen.getByTestId("metric-tile-claim-integrity");
    const toneTile = screen.getByTestId("metric-tile-scholarly-tone");

    expect(covTile).toHaveClass("rounded-lg");
    expect(covTile).toHaveClass("shadow-none");
    expect(covTile).toHaveTextContent("85%");

    expect(intTile).toHaveClass("rounded-lg");
    expect(intTile).toHaveClass("shadow-none");
    expect(intTile).toHaveTextContent("90%");

    expect(toneTile).toHaveClass("rounded-lg");
    expect(toneTile).toHaveClass("shadow-none");
    expect(toneTile).toHaveTextContent("92%");
  });
});
