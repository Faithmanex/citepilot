// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { DemoEditorSurface } from "../DemoEditorSurface";
import { splitTextIntoSegments } from "../spanMutation";
import { ACADEMIC_DRAFTS } from "../sampleDrafts";

describe("DemoEditorSurface Component", () => {
  afterEach(() => {
    cleanup();
  });

  const sampleDraft = ACADEMIC_DRAFTS["lit-review"];
  const segments = splitTextIntoSegments(
    sampleDraft.initialText,
    sampleDraft.defaultSuggestions,
    null,
    null
  );

  it("renders text segments and highlighted spans in preset mode", () => {
    render(
      <DemoEditorSurface
        currentText={sampleDraft.initialText}
        textSegments={segments}
        isCustomTyping={false}
        onUpdateText={vi.fn()}
        onSelectSuggestion={vi.fn()}
      />
    );

    expect(screen.getByTestId("demo-manuscript-canvas")).toBeInTheDocument();
    expect(screen.getByTestId("highlight-lit-1")).toBeInTheDocument();
    expect(screen.getByTestId("highlight-lit-2")).toBeInTheDocument();
    expect(screen.getByTestId("highlight-lit-3")).toBeInTheDocument();
    expect(screen.getByTestId("highlight-lit-4")).toBeInTheDocument();
  });

  it("invokes onSelectSuggestion when an inline highlighted span is clicked", () => {
    const handleSelect = vi.fn();
    render(
      <DemoEditorSurface
        currentText={sampleDraft.initialText}
        textSegments={segments}
        isCustomTyping={false}
        onUpdateText={vi.fn()}
        onSelectSuggestion={handleSelect}
      />
    );

    const span = screen.getByTestId("highlight-lit-1");
    fireEvent.click(span);

    expect(handleSelect).toHaveBeenCalledWith("lit-1");
  });

  it("supports keyboard Enter selection on highlighted spans", () => {
    const handleSelect = vi.fn();
    render(
      <DemoEditorSurface
        currentText={sampleDraft.initialText}
        textSegments={segments}
        isCustomTyping={false}
        onUpdateText={vi.fn()}
        onSelectSuggestion={handleSelect}
      />
    );

    const span = screen.getByTestId("highlight-lit-2");
    fireEvent.keyDown(span, { key: "Enter" });

    expect(handleSelect).toHaveBeenCalledWith("lit-2");
  });

  it("renders interactive textarea in custom typing mode and handles text changes", () => {
    const handleUpdate = vi.fn();
    render(
      <DemoEditorSurface
        currentText="Custom manuscript text."
        textSegments={[{ type: "text", key: "0", content: "Custom manuscript text." }]}
        isCustomTyping={true}
        onUpdateText={handleUpdate}
        onSelectSuggestion={vi.fn()}
      />
    );

    const textarea = screen.getByTestId("custom-manuscript-textarea");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue("Custom manuscript text.");

    fireEvent.change(textarea, { target: { value: "New updated manuscript prose." } });
    expect(handleUpdate).toHaveBeenCalledWith("New updated manuscript prose.");
  });
});
