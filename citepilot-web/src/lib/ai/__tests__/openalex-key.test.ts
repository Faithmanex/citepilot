import { describe, expect, it, vi } from "vitest";

// OpenAlex requires a free API key since February 2026. The key must be sent to
// every endpoint (DOI lookup and title search), or cloud-hosted lookups share a
// small keyless budget and are rate-limited.
vi.hoisted(() => {
  process.env.OPENALEX_API_KEY = "test-openalex-key";
});

vi.mock("../http", () => ({
  getJson: vi.fn(),
  HttpError: class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.name = "HttpError";
      this.status = status;
    }
  },
}));

const { getJson } = await import("../http");
const { validateReferenceWithOpenalex } = await import("../openalex");

const work = {
  id: "https://openalex.org/W1",
  title: "Deep learning",
  doi: "https://doi.org/10.1038/nature14539",
  publication_year: 2015,
  is_retracted: false,
  primary_location: { source: { display_name: "Nature" } },
  biblio: { volume: "521", first_page: "436", last_page: "444" },
};

describe("OpenAlex API key", () => {
  it("sends the configured key with a DOI lookup", async () => {
    vi.mocked(getJson).mockReset().mockResolvedValueOnce(work);

    await validateReferenceWithOpenalex({
      parsed_title: "Deep learning",
      parsed_doi: "10.1038/nature14539",
      parsed_authors: [],
    } as never);

    const url = String(vi.mocked(getJson).mock.calls[0][0]);
    expect(url).toContain("api_key=test-openalex-key");
  });

  it("sends the configured key with a title search", async () => {
    vi.mocked(getJson)
      .mockReset()
      .mockResolvedValueOnce({ results: [work] });

    await validateReferenceWithOpenalex({
      parsed_title: "Deep learning",
      parsed_doi: null,
      parsed_authors: [],
    } as never);

    const url = String(vi.mocked(getJson).mock.calls[0][0]);
    expect(url).toContain("/works?");
    expect(url).toContain("api_key=test-openalex-key");
  });
});
