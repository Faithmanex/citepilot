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

  it("renders semantic HTML with real headings and bold styling", () => {
    const handleUpdate = vi.fn();
    const html = "<h1>Chapter 1: Introduction</h1><h2>1.1 Background of the Study</h2><p>The <strong>authentication system</strong> is vital.</p>";

    render(
      <LexicalDocumentCanvas
        initialText="Chapter 1: Introduction\n\n1.1 Background of the Study\n\nThe authentication system is vital."
        initialHtml={html}
        onUpdateText={handleUpdate}
      />
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Chapter 1: Introduction");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("1.1 Background of the Study");
    expect(screen.getByText("authentication system")).toBeInTheDocument();
  });

  it("has valid Lexical typography theme tokens", () => {
    expect(lexicalEditorTheme.paragraph).toContain("font-serif");
    expect(lexicalEditorTheme.text?.bold).toContain("font-bold");
    expect(lexicalEditorTheme.text?.underline).toContain("underline");
  });
});
