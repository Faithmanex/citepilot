// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import fs from "fs";
import path from "path";

import { Button } from "../button";
import { Badge } from "../badge";
import { Tag } from "../tag";
import { Container } from "../container";
import { Section } from "../section";
import { Card } from "../card";

describe("Milestone 1 — Adversarial Empirical CSS & Layout Audit", () => {
  afterEach(() => {
    cleanup();
  });

  const globalsCssPath = path.resolve(process.cwd(), "src/app/globals.css");
  const globalsCss = fs.readFileSync(globalsCssPath, "utf-8");

  describe("1. Design System Tokens & Grammarly Palette Resolution", () => {
    const REQUIRED_PALETTE_TOKENS: Record<string, string> = {
      "--color-teal-primary": "#027e6f",
      "--color-midnight-navy": "#1f243c",
      "--color-ink-black": "#0e101a",
      "--color-graphite": "#545454",
      "--color-steel": "#707070",
      "--color-silver": "#b7b7b7",
      "--color-ash": "#d9d9d9",
      "--color-fog": "#ebebeb",
      "--color-cloud": "#f5f5f5",
      "--color-carbon": "#1c1c1c",
      "--color-slate": "#4d536e",
      "--color-paper": "#ffffff",
    };

    it("verifies all 12 Grammarly editorial palette tokens are defined exactly in @theme", () => {
      for (const [token, hex] of Object.entries(REQUIRED_PALETTE_TOKENS)) {
        const regex = new RegExp(`${token}\\s*:\\s*${hex}`, "i");
        expect(globalsCss).toMatch(regex);
      }
    });

    it("verifies teal interactive state tokens exist in @theme", () => {
      expect(globalsCss).toMatch(/--color-teal-hover\s*:\s*#02665a/i);
      expect(globalsCss).toMatch(/--color-teal-active\s*:\s*#014d44/i);
      expect(globalsCss).toMatch(/--color-teal-tint\s*:\s*#e6f4f2/i);
      expect(globalsCss).toMatch(/--color-teal-border\s*:\s*#a7dcd4/i);
    });

    it("verifies typography definitions for Manrope display and Inter sans", () => {
      expect(globalsCss).toMatch(/--font-display\s*:\s*.*Manrope/i);
      expect(globalsCss).toMatch(/--font-sans\s*:\s*.*Inter/i);
    });
  });

  describe("2. Flat Surface Elevation & Zero Drop Shadows Enforcement", () => {
    it("verifies all shadow tokens are explicitly neutralized to 'none' in globals.css @theme", () => {
      const shadowTokens = [
        "--shadow-none",
        "--shadow-2xs",
        "--shadow-xs",
        "--shadow-sm",
        "--shadow-md",
        "--shadow-lg",
        "--shadow-xl",
        "--shadow-2xl",
      ];
      for (const token of shadowTokens) {
        const regex = new RegExp(`${token}\\s*:\\s*none\\s*;`, "i");
        expect(globalsCss).toMatch(regex);
      }
    });

    it("verifies focus-visible outlines override box-shadow to 'none !important'", () => {
      expect(globalsCss).toMatch(/box-shadow\s*:\s*none\s*!important/i);
    });

    it("verifies atomic UI components explicitly include shadow-none", () => {
      render(
        <div>
          <Button data-testid="test-btn">Test Button</Button>
          <Badge data-testid="test-badge">Test Badge</Badge>
          <Card data-testid="test-card">Test Card</Card>
        </div>
      );

      const btn = screen.getByTestId("test-btn");
      const badge = screen.getByTestId("test-badge");
      const card = screen.getByTestId("test-card");

      expect(btn).toHaveClass("shadow-none");
      expect(badge).toHaveClass("shadow-none");
      expect(card).toHaveClass("shadow-none");
    });
  });

  describe("3. Strict 8px Border Radius Standard & Pill Elimination", () => {
    it("verifies --radius-full and larger radius tokens are capped to 8px in @theme", () => {
      expect(globalsCss).toMatch(/--radius-sm\s*:\s*8px\s*;/i);
      expect(globalsCss).toMatch(/--radius-md\s*:\s*8px\s*;/i);
      expect(globalsCss).toMatch(/--radius-lg\s*:\s*8px\s*;/i);
      expect(globalsCss).toMatch(/--radius-xl\s*:\s*8px\s*;/i);
      expect(globalsCss).toMatch(/--radius-2xl\s*:\s*8px\s*;/i);
      expect(globalsCss).toMatch(/--radius-3xl\s*:\s*8px\s*;/i);
      expect(globalsCss).toMatch(/--radius-full\s*:\s*8px\s*;/i);
    });

    it("verifies Button, Badge, Tag, and Card enforce 8px standard radius", () => {
      render(
        <div>
          <Button data-testid="test-btn">Action</Button>
          <Badge data-testid="test-badge">Status</Badge>
          <Tag data-testid="test-tag">Category</Tag>
          <Card data-testid="test-card">Card Body</Card>
        </div>
      );

      const btn = screen.getByTestId("test-btn");
      const badge = screen.getByTestId("test-badge");
      const tag = screen.getByTestId("test-tag");
      const card = screen.getByTestId("test-card");

      expect(btn).toHaveClass("rounded-lg");
      expect(badge).toHaveClass("rounded-[8px]");
      expect(tag).toHaveClass("rounded-[8px]");
      expect(card).toHaveClass("rounded-[8px]");
    });
  });

  describe("4. Responsive Layout Constraints & 1200px Max-Width Standard", () => {
    it("verifies Container defaults to 1200px max-width with responsive horizontal gutters", () => {
      render(<Container data-testid="container">Container Content</Container>);
      const container = screen.getByTestId("container");

      expect(container).toHaveClass("max-w-[1200px]");
      expect(container).toHaveClass("mx-auto");
      // Mobile gutter (16px)
      expect(container).toHaveClass("px-4");
      // Tablet gutter (24px)
      expect(container).toHaveClass("sm:px-6");
      // Desktop gutter (32px)
      expect(container).toHaveClass("lg:px-8");
    });

    it("verifies Container size variants (narrow=800px, wide=1400px, full=100%)", () => {
      const { rerender } = render(<Container size="narrow" data-testid="c">Narrow</Container>);
      let c = screen.getByTestId("c");
      expect(c).toHaveClass("max-w-[800px]");

      rerender(<Container size="wide" data-testid="c">Wide</Container>);
      c = screen.getByTestId("c");
      expect(c).toHaveClass("max-w-[1400px]");

      rerender(<Container size="full" data-testid="c">Full</Container>);
      c = screen.getByTestId("c");
      expect(c).toHaveClass("max-w-full");
    });

    it("verifies Section component embeds responsive 1200px container by default", () => {
      const { container } = render(
        <Section variant="cloud" spacing="standard">
          <p>Section Inner</p>
        </Section>
      );

      const section = container.firstElementChild as HTMLElement;
      expect(section.tagName).toBe("SECTION");
      expect(section).toHaveClass("bg-[#f5f5f5]");
      expect(section).toHaveClass("py-16");
      expect(section).toHaveClass("md:py-24");
      expect(section).toHaveClass("lg:py-28");

      const innerContainer = section.firstElementChild;
      expect(innerContainer).toHaveClass("max-w-[1200px]");
      expect(innerContainer).toHaveClass("mx-auto");
      expect(innerContainer).toHaveClass("px-4");
      expect(innerContainer).toHaveClass("sm:px-6");
      expect(innerContainer).toHaveClass("lg:px-8");
    });

    it("verifies Section full-bleed Enterprise Teal variant", () => {
      const { container } = render(
        <Section variant="teal" spacing="enterprise">
          <p>Enterprise Content</p>
        </Section>
      );

      const section = container.firstElementChild as HTMLElement;
      expect(section).toHaveClass("bg-[#027e6f]");
      expect(section).toHaveClass("text-white");
      expect(section).toHaveClass("py-20");
      expect(section).toHaveClass("md:py-28");
    });
  });

  describe("5. Component Variant Stress & Accessibility", () => {
    it("verifies Button primary, secondary, ghost-white, and subdued color schemes", () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>);
      let btn = screen.getByRole("button", { name: /primary/i });
      expect(btn).toHaveClass("bg-[#027e6f]");
      expect(btn).toHaveClass("text-white");

      rerender(<Button variant="secondary">Secondary</Button>);
      btn = screen.getByRole("button", { name: /secondary/i });
      expect(btn).toHaveClass("border-[#0e101a]");
      expect(btn).toHaveClass("text-[#0e101a]");

      rerender(<Button variant="ghost-white">Ghost White</Button>);
      btn = screen.getByRole("button", { name: /ghost white/i });
      expect(btn).toHaveClass("border-white/80");
      expect(btn).toHaveClass("text-white");

      rerender(<Button variant="subdued">Subdued</Button>);
      btn = screen.getByRole("button", { name: /subdued/i });
      expect(btn).toHaveClass("text-[#545454]");
    });

    it("verifies all 4 citation audit categories in Badge", () => {
      const { container, rerender } = render(<Badge variant="missing-citation">Missing Citation</Badge>);
      let badge = container.firstElementChild;
      expect(badge).toHaveClass("bg-[#e6f4f2]");
      expect(badge).toHaveClass("text-[#027e6f]");

      rerender(<Badge variant="claim-needs-source">Claim Needs Source</Badge>);
      badge = container.firstElementChild;
      expect(badge).toHaveClass("bg-[#fef3c7]");
      expect(badge).toHaveClass("text-[#92400e]");

      rerender(<Badge variant="outdated-reference">Outdated Reference</Badge>);
      badge = container.firstElementChild;
      expect(badge).toHaveClass("bg-[#ede9fe]");
      expect(badge).toHaveClass("text-[#5b21b6]");

      rerender(<Badge variant="tone-clarity">Tone & Clarity</Badge>);
      badge = container.firstElementChild;
      expect(badge).toHaveClass("bg-[#f5f5f5]");
      expect(badge).toHaveClass("text-[#1f243c]");
    });

    it("verifies Card variants with hairline borders and zero shadows", () => {
      const { rerender } = render(<Card variant="paper">Paper Card</Card>);
      let card = screen.getByText("Paper Card");
      expect(card).toHaveClass("bg-[#ffffff]");
      expect(card).toHaveClass("border-[#ebebeb]");
      expect(card).toHaveClass("shadow-none");
      expect(card).toHaveClass("rounded-[8px]");

      rerender(<Card variant="cloud">Cloud Card</Card>);
      card = screen.getByText("Cloud Card");
      expect(card).toHaveClass("bg-[#f5f5f5]");
      expect(card).toHaveClass("border-[#ebebeb]");

      rerender(<Card variant="dark">Dark Card</Card>);
      card = screen.getByText("Dark Card");
      expect(card).toHaveClass("bg-[#0e101a]");
      expect(card).toHaveClass("border-white/15");

      rerender(<Card variant="teal">Teal Card</Card>);
      card = screen.getByText("Teal Card");
      expect(card).toHaveClass("bg-[#02665a]");
      expect(card).toHaveClass("border-white/20");
    });
  });
});
