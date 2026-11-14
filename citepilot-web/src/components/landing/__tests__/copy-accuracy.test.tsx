// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import FAQ from "../FAQ";
import HowItWorks from "../HowItWorks";
import SubscriptionSection from "../SubscriptionSection";
import Hero from "../Hero";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/components/subscription/PayPalSubscriptionButton", () => ({
  default: () => null,
}));
vi.mock("@/components/landing/demo", () => ({
  InteractiveDemoEditor: () => <div data-testid="demo" />,
}));

function visibleText(container: HTMLElement): string {
  return container.textContent || "";
}

/** FAQ answers only render when expanded, one at a time. */
function faqAnswerText(): string {
  render(<FAQ />);
  const buttons = screen.getAllByRole("button");
  const answers: string[] = [];
  buttons.forEach((button, index) => {
    fireEvent.click(button);
    const answer = document.getElementById(`faq-answer-${index}`);
    if (answer) answers.push(answer.textContent || "");
  });
  return answers.join(" ");
}

describe("product copy matches implemented behaviour", () => {
  beforeEach(() => cleanup());
  afterEach(() => cleanup());

  it("advertises the real upload limit and formats", () => {
    const text = faqAnswerText();

    expect(text).toContain("10 MB");
    expect(text).toContain("200,000 characters");
    expect(text).toContain(".docx");
    expect(text).toContain(".rtf");
    expect(text).toContain(".bib");
    expect(text).not.toMatch(/50 MB/i);
    expect(text).not.toMatch(/any length/i);
  });

  it("does not claim daily audit quotas or a sessionless service that does not exist", () => {
    const text = faqAnswerText();

    expect(text).not.toMatch(/3 manuscript audits per day/i);
    expect(text).not.toMatch(/sessionless/i);
    expect(text).toContain("1,500 words");
    expect(text).toMatch(/saved to your history/i);
  });

  it("lists every style the server accepts", () => {
    const text = faqAnswerText();

    for (const style of [
      "APA 7th",
      "APA 6th",
      "MLA 9th",
      "Chicago author-date",
      "Chicago notes",
      "Harvard",
      "IEEE",
      "Vancouver",
      "Turabian",
      "OSCOLA",
    ]) {
      expect(text).toContain(style);
    }
    expect(text).not.toMatch(/all 9 citation/i);
  });

  it("prices limits that exist and drops unimplemented priority processing", () => {
    const { container } = render(<SubscriptionSection />);
    const text = visibleText(container);

    expect(text).toContain("$12.99");
    expect(text).toContain("200,000 characters");
    expect(text).toContain("1,500 words");
    expect(text).not.toMatch(/unlimited words/i);
    expect(text).not.toMatch(/priority processing/i);
    expect(text).toContain("All 10 citation styles");
  });

  it("describes the pipeline without real-time or any-length promises", () => {
    const { container } = render(<HowItWorks />);
    const text = visibleText(container);

    expect(text).toContain("up to 10 MB");
    expect(text).not.toMatch(/any length/i);
  });

  it("keeps the hero honest about processing and training", () => {
    const { container } = render(<Hero />);
    const text = visibleText(container);

    expect(text).toContain("audits a manuscript in one pass");
    expect(text).not.toMatch(/real time/i);
    expect(text).toContain("never used for training");
  });
});
