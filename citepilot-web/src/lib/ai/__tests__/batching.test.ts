import { beforeEach, describe, expect, it, vi } from "vitest";

// Keep the real concurrency helper (the bound under test is the *number of
// calls*, not how they are scheduled) and stub only the provider call.
vi.mock("../llm", async () => {
  const actual = await vi.importActual<typeof import("../llm")>("../llm");
  return {
    ...actual,
    callGeminiValidated: vi.fn(async () => ({ citations: [], references: [] })),
  };
});

const { callGeminiValidated } = await import("../llm");
const { extractCitations, parseReferences } = await import("../citation-extractor");

function promptText(callIndex: number): string {
  return String(vi.mocked(callGeminiValidated).mock.calls[callIndex][0]);
}

function sliceBetween(text: string, start: string, end: string): string {
  const from = text.indexOf(start);
  const to = text.indexOf(end, from + start.length);
  return text.slice(from + start.length, to);
}

beforeEach(() => {
  vi.mocked(callGeminiValidated).mockClear();
});

describe("bounded provider fan-out", () => {
  it("caps citation extraction calls and still covers every paragraph", async () => {
    // A 10-page manuscript is roughly 240 paragraphs. At 4 paragraphs per call
    // that is 60 queued provider calls inside a single 28s stage window; the
    // tail would never run and its citations would silently disappear.
    const total = 240;
    const text = Array.from(
      { length: total },
      (_, i) => `Paragraph ${i} argues that citation integrity matters (Smith, 2020).`
    ).join("\n\n");

    await extractCitations(text, "apa7");

    const calls = vi.mocked(callGeminiValidated).mock.calls.length;
    expect(calls).toBeLessThanOrEqual(12);

    const covered = new Set<number>();
    for (let i = 0; i < calls; i += 1) {
      const payload = sliceBetween(
        promptText(i),
        "Document paragraphs:\n",
        "\n\nReturn a JSON object"
      );
      for (const paragraph of JSON.parse(payload) as { paragraph_index: number }[]) {
        covered.add(paragraph.paragraph_index);
      }
    }
    expect(covered.size).toBe(total);
  });

  it("caps reference parsing calls and keeps every line of a bibliography", async () => {
    // Reference lists are usually one entry per line with no blank lines, so a
    // paragraph-only split would send the entire list to one call.
    const total = 80;
    const text = Array.from(
      { length: total },
      (_, i) =>
        `Author${i}, A. (2020). Title ${i}. Journal of Testing, 1(1), 1-2. https://doi.org/10.1000/${i}`
    ).join("\n");

    await parseReferences(text, Date.now() + 30_000);

    const calls = vi.mocked(callGeminiValidated).mock.calls.length;
    expect(calls).toBeGreaterThan(1);
    expect(calls).toBeLessThanOrEqual(8);

    const seen = new Set<string>();
    for (let i = 0; i < calls; i += 1) {
      const payload = sliceBetween(
        promptText(i),
        "Reference text:\n",
        "\n\nReturn a JSON object"
      );
      for (const line of payload.split("\n")) {
        if (line.trim()) seen.add(line.trim());
      }
    }
    expect(seen.size).toBe(total);
  });

  it("keeps a short document in a single call", async () => {
    const text = Array.from(
      { length: 4 },
      (_, i) => `Short paragraph ${i} (Smith, 2020).`
    ).join("\n\n");

    await extractCitations(text, "apa7");

    expect(vi.mocked(callGeminiValidated).mock.calls.length).toBe(1);
  });
});
