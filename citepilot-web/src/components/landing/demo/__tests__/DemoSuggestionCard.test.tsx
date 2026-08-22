// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { DemoSuggestionCard } from "../DemoSuggestionCard";
import { ACADEMIC_DRAFTS } from "../sampleDrafts";

describe("DemoSuggestionCard Component", () => {
  afterEach(() => {
    cleanup();
  });

  const sampleSuggestion = ACADEMIC_DRAFTS["lit-review"].defaultSuggestions[0]; // lit-1

  it("renders empty state placeholder when no suggestion is selected", () => {
    render(
      <DemoSuggestionCard
        suggestion={null}
        onAccept={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByTestId("suggestion-card-empty")).toBeInTheDocument();
    expect(screen.getByText(/no citation selected/i)).toBeInTheDocument();
  });

  it("renders suggestion details, diff comparison, and metadata when suggestion is provided", () => {
    render(
      <DemoSuggestionCard
        suggestion={sampleSuggestion}
        onAccept={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByTestId("demo-suggestion-card")).toBeInTheDocument();
    expect(screen.getByText("Missing Citation")).toBeInTheDocument();
    expect(screen.getByText("Unattributed Architectural Claim")).toBeInTheDocument();
    expect(screen.getByText(sampleSuggestion.originalText)).toBeInTheDocument();
    expect(screen.getByText(sampleSuggestion.replacementText)).toBeInTheDocument();
    expect(screen.getByText(/crossref verified/i)).toBeInTheDocument();
    expect(screen.getByText(/10.48550/i)).toBeInTheDocument();
  });

  it("fires onAccept when Accept Fix button is clicked", () => {
    const handleAccept = vi.fn();
    render(
      <DemoSuggestionCard
        suggestion={sampleSuggestion}
        onAccept={handleAccept}
        onDismiss={vi.fn()}
      />
    );

    const acceptBtn = screen.getByRole("button", { name: /accept fix/i });
    fireEvent.click(acceptBtn);

    expect(handleAccept).toHaveBeenCalledWith("lit-1");
  });

  it("fires onDismiss when Dismiss button is clicked", () => {
    const handleDismiss = vi.fn();
    render(
      <DemoSuggestionCard
        suggestion={sampleSuggestion}
        onAccept={vi.fn()}
        onDismiss={handleDismiss}
      />
    );

    const dismissBtn = screen.getByRole("button", { name: /dismiss/i });
    fireEvent.click(dismissBtn);

    expect(handleDismiss).toHaveBeenCalledWith("lit-1");
  });

  it("supports keyboard shortcuts (A for accept, D for dismiss)", () => {
    const handleAccept = vi.fn();
    const handleDismiss = vi.fn();

    render(
      <DemoSuggestionCard
        suggestion={sampleSuggestion}
        onAccept={handleAccept}
        onDismiss={handleDismiss}
      />
    );

    fireEvent.keyDown(window, { key: "a" });
    expect(handleAccept).toHaveBeenCalledWith("lit-1");

    fireEvent.keyDown(window, { key: "d" });
    expect(handleDismiss).toHaveBeenCalledWith("lit-1");
  });
});
