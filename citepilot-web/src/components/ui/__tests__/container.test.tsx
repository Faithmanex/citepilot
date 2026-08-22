// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Container } from "../container";

describe("Grammarly Editorial Container Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders with default 1200px max-width and responsive padding", () => {
    render(<Container data-testid="container">Content</Container>);
    const container = screen.getByTestId("container");
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass("max-w-[1200px]");
    expect(container).toHaveClass("mx-auto");
    expect(container).toHaveClass("px-4");
    expect(container).toHaveClass("sm:px-6");
    expect(container).toHaveClass("lg:px-8");
  });

  it("renders narrow container (800px max-width)", () => {
    render(<Container size="narrow" data-testid="container">Narrow Content</Container>);
    const container = screen.getByTestId("container");
    expect(container).toHaveClass("max-w-[800px]");
  });

  it("renders wide container (1400px max-width)", () => {
    render(<Container size="wide" data-testid="container">Wide Content</Container>);
    const container = screen.getByTestId("container");
    expect(container).toHaveClass("max-w-[1400px]");
  });

  it("renders polymorphic element type (e.g. section, header)", () => {
    render(
      <Container as="section" data-testid="container">
        Section Container
      </Container>
    );
    const container = screen.getByTestId("container");
    expect(container.tagName).toBe("SECTION");
  });

  it("supports noPadding prop", () => {
    render(<Container noPadding data-testid="container">No Padding</Container>);
    const container = screen.getByTestId("container");
    expect(container).not.toHaveClass("px-4");
  });
});
