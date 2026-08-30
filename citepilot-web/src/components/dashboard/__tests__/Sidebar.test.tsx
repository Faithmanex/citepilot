// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import Sidebar from "../Sidebar";

// Mock next/navigation useRouter
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("Sidebar Navigation Subsystem", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the 3 streamlined primary navigation items", () => {
    const handlePanelChange = vi.fn();
    render(
      <Sidebar
        activePanel="workspace"
        onPanelChange={handlePanelChange}
        badges={{ totalIssues: 5 }}
      />
    );

    expect(screen.getByText("Editor Workspace")).toBeInTheDocument();
    expect(screen.getByText("Audit History")).toBeInTheDocument();
    expect(screen.getByText("Export Report")).toBeInTheDocument();

    // Verify 9 old panels are not present in the sidebar
    expect(screen.queryByText("Citation Matching")).not.toBeInTheDocument();
    expect(screen.queryByText("Crossref Check")).not.toBeInTheDocument();
    expect(screen.queryByText("Style Rules")).not.toBeInTheDocument();
    expect(screen.queryByText("Uncited Claims")).not.toBeInTheDocument();
    expect(screen.queryByText("Recency Analysis")).not.toBeInTheDocument();
    expect(screen.queryByText("Document Structure")).not.toBeInTheDocument();
  });

  it("displays total issues badge counter on Editor Workspace item", () => {
    const handlePanelChange = vi.fn();
    render(
      <Sidebar
        activePanel="workspace"
        onPanelChange={handlePanelChange}
        badges={{ totalIssues: 7 }}
      />
    );

    const badge = screen.getByText("7");
    expect(badge).toBeInTheDocument();
  });

  it("triggers onPanelChange callback when clicking navigation items", () => {
    const handlePanelChange = vi.fn();
    render(
      <Sidebar
        activePanel="workspace"
        onPanelChange={handlePanelChange}
        badges={{ totalIssues: 0 }}
      />
    );

    const historyBtn = screen.getByRole("button", { name: /Audit History/i });
    fireEvent.click(historyBtn);
    expect(handlePanelChange).toHaveBeenCalledWith("history");

    const exportBtn = screen.getByRole("button", { name: /Export Report/i });
    fireEvent.click(exportBtn);
    expect(handlePanelChange).toHaveBeenCalledWith("export");
  });

  it("supports overview panel alias for backward compatibility", () => {
    const handlePanelChange = vi.fn();
    render(
      <Sidebar
        activePanel="overview"
        onPanelChange={handlePanelChange}
        badges={{ totalIssues: 3 }}
      />
    );

    const workspaceBtn = screen.getByRole("button", { name: /Editor Workspace/i });
    expect(workspaceBtn).toHaveAttribute("aria-current", "page");
  });
});
