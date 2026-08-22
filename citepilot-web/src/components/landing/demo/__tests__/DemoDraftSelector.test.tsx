// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { DemoDraftSelector } from "../DemoDraftSelector";

describe("DemoDraftSelector Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders all 4 academic draft tabs with icons and names", () => {
    const handleSelect = vi.fn();
    const handleReset = vi.fn();

    render(
      <DemoDraftSelector
        activeDraftId="lit-review"
        onSelectDraft={handleSelect}
        onReset={handleReset}
      />
    );

    expect(screen.getByRole("tab", { name: /literature review/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /introduction/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /discussion/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /custom draft/i })).toBeInTheDocument();
  });

  it("applies active styling to the currently selected draft tab", () => {
    render(
      <DemoDraftSelector
        activeDraftId="intro"
        onSelectDraft={vi.fn()}
        onReset={vi.fn()}
      />
    );

    const activeTab = screen.getByRole("tab", { name: /introduction/i });
    const inactiveTab = screen.getByRole("tab", { name: /literature review/i });

    expect(activeTab).toHaveAttribute("aria-selected", "true");
    expect(activeTab).toHaveClass("bg-[#ffffff]");
    expect(activeTab).toHaveClass("text-[#0e101a]");

    expect(inactiveTab).toHaveAttribute("aria-selected", "false");
    expect(inactiveTab).toHaveClass("bg-transparent");
  });

  it("invokes onSelectDraft when an inactive tab is clicked", () => {
    const handleSelect = vi.fn();
    render(
      <DemoDraftSelector
        activeDraftId="lit-review"
        onSelectDraft={handleSelect}
        onReset={vi.fn()}
      />
    );

    const discussionTab = screen.getByRole("tab", { name: /discussion/i });
    fireEvent.click(discussionTab);

    expect(handleSelect).toHaveBeenCalledWith("discussion");
  });

  it("disables reset button when isDirty is false, enables when isDirty is true", () => {
    const handleReset = vi.fn();
    const { rerender } = render(
      <DemoDraftSelector
        activeDraftId="lit-review"
        onSelectDraft={vi.fn()}
        onReset={handleReset}
        isDirty={false}
      />
    );

    const resetBtn = screen.getByRole("button", { name: /reset draft/i });
    expect(resetBtn).toBeDisabled();

    rerender(
      <DemoDraftSelector
        activeDraftId="lit-review"
        onSelectDraft={vi.fn()}
        onReset={handleReset}
        isDirty={true}
      />
    );

    expect(resetBtn).toBeEnabled();
    fireEvent.click(resetBtn);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
