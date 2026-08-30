// @vitest-environment jsdom
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LexicalDocumentCanvas } from "../LexicalDocumentCanvas";
import { lexicalEditorTheme } from "../theme";

describe("Lexical Rich Text Canvas Component", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the Lexical rich text composer and contenteditable surface", () => {
    const handleUpdate = vi.fn();

    render(
      <LexicalDocumentCanvas
        initialText="Sample academic prose on genome editing."
        onUpdateText={handleUpdate}
      />
    );

    expect(screen.getByTestId("lexical-document-canvas")).toBeInTheDocument();
    expect(screen.getByTestId("lexical-content-editable")).toBeInTheDocument();
    expect(screen.getByText(/Sample academic prose on genome editing/i)).toBeInTheDocument();
  });

  it("has valid Lexical typography theme tokens", () => {
    expect(lexicalEditorTheme.paragraph).toContain("font-serif");
    expect(lexicalEditorTheme.text?.bold).toContain("font-bold");
    expect(lexicalEditorTheme.text?.underline).toContain("underline");
  });
});
