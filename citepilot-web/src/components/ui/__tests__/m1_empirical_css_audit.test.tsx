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
      "--color-teal-primary": "#2c3e8c",
      "--color-midnight-navy": "#14181f",
      "--color-ink-black": "#221d16",
      "--color-graphite": "#5c5344",
      "--color-steel": "#948a76",
      "--color-silver": "#d9cfb8",
      "--color-ash": "#d9cfb8",
      "--color-fog": "#d9cfb8",
      "--color-cloud": "#faf6ec",
      "--color-carbon": "#221d16",
      "--color-slate": "#5c5344",
      "--color-paper": "#f1ebdc",
    };

    it("verifies all 12 Grammarly editorial palette tokens are defined exactly in @theme", () => {
      for (const [token, hex] of Object.entries(REQUIRED_PALETTE_TOKENS)) {
        const regex = new RegExp(`${token}\\s*:\\s*${hex}`, "i");
        expect(globalsCss).toMatch(regex);
      }
    });

    it("verifies teal interactive state tokens exist in @theme", () => {
      expect(globalsCss).toMatch(/--color-teal-hover\s*:\s*#24357a/i);
      expect(globalsCss).toMatch(/--color-teal-active\s*:\s*#1b2a66/i);
      expect(globalsCss).toMatch(/--color-teal-tint\s*:\s*#e7e9f5/i);
      expect(globalsCss).toMatch(/--color-teal-border\s*:\s*#c9cee8/i);
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
      expect(section).toHaveClass("bg-[#faf6ec]");
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
      expect(section).toHaveClass("bg-[#2c3e8c]");
      expect(section).toHaveClass("text-white");
      expect(section).toHaveClass("py-20");
      expect(section).toHaveClass("md:py-28");
    });
  });

  describe("5. Component Variant Stress & Accessibility", () => {
    it("verifies Button primary, secondary, ghost-white, and subdued color schemes", () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>);
      let btn = screen.getByRole("button", { name: /primary/i });
      expect(btn).toHaveClass("bg-[#2c3e8c]");
      expect(btn).toHaveClass("text-white");

      rerender(<Button variant="secondary">Secondary</Button>);
      btn = screen.getByRole("button", { name: /secondary/i });
      expect(btn).toHaveClass("border-[#221d16]");
      expect(btn).toHaveClass("text-[#221d16]");

      rerender(<Button variant="ghost-white">Ghost White</Button>);
      btn = screen.getByRole("button", { name: /ghost white/i });
      expect(btn).toHaveClass("border-white/80");
      expect(btn).toHaveClass("text-white");

      rerender(<Button variant="subdued">Subdued</Button>);
      btn = screen.getByRole("button", { name: /subdued/i });
      expect(btn).toHaveClass("text-[#5c5344]");
    });

    it("verifies all 4 citation audit categories in Badge", () => {
      const { container, rerender } = render(<Badge variant="missing-citation">Missing Citation</Badge>);
      let badge = container.firstElementChild;
      expect(badge).toHaveClass("bg-[#e7e9f5]");
      expect(badge).toHaveClass("text-[#2c3e8c]");

      rerender(<Badge variant="claim-needs-source">Claim Needs Source</Badge>);
      badge = container.firstElementChild;
      expect(badge).toHaveClass("bg-[#f1e4c8]");
      expect(badge).toHaveClass("text-[#93650f]");

      rerender(<Badge variant="outdated-reference">Outdated Reference</Badge>);
      badge = container.firstElementChild;
      expect(badge).toHaveClass("bg-[#f1e4c8]");
      expect(badge).toHaveClass("text-[#93650f]");

      rerender(<Badge variant="tone-clarity">Tone & Clarity</Badge>);
      badge = container.firstElementChild;
      expect(badge).toHaveClass("bg-[#faf6ec]");
      expect(badge).toHaveClass("text-[#14181f]");
    });

    it("verifies Card variants with hairline borders and zero shadows", () => {
      const { rerender } = render(<Card variant="paper">Paper Card</Card>);
      let card = screen.getByText("Paper Card");
      expect(card).toHaveClass("bg-[#ffffff]");
      expect(card).toHaveClass("border-[#d9cfb8]");
      expect(card).toHaveClass("shadow-none");
      expect(card).toHaveClass("rounded-[8px]");

      rerender(<Card variant="cloud">Cloud Card</Card>);
      card = screen.getByText("Cloud Card");
      expect(card).toHaveClass("bg-[#faf6ec]");
      expect(card).toHaveClass("border-[#d9cfb8]");

      rerender(<Card variant="dark">Dark Card</Card>);
      card = screen.getByText("Dark Card");
      expect(card).toHaveClass("bg-[#221d16]");
      expect(card).toHaveClass("border-white/15");

      rerender(<Card variant="teal">Teal Card</Card>);
      card = screen.getByText("Teal Card");
      expect(card).toHaveClass("bg-[#24357a]");
      expect(card).toHaveClass("border-white/20");
    });
  });
});
