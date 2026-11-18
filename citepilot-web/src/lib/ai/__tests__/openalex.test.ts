import { beforeEach, describe, expect, it, vi } from "vitest";

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

const { getJson, HttpError } = await import("../http");
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

const reference = {
  parsed_title: "Deep learning",
  parsed_journal: "Nature",
  parsed_volume: "521",
  parsed_pages: "436-444",
  parsed_doi: "10.1038/nature14539",
  parsed_year: 2015,
  parsed_authors: [],
};

beforeEach(() => {
  vi.mocked(getJson).mockReset();
});

describe("OpenAlex API access", () => {
  it("does not append an empty api_key when no key is configured", async () => {
    // Keyless requests are rate-limited per egress IP, but sending
    // `api_key=` (empty) would be rejected as a malformed key instead.
    vi.mocked(getJson).mockResolvedValueOnce(work);
    await validateReferenceWithOpenalex(reference as never);
    const url = String(vi.mocked(getJson).mock.calls[0][0]);
    expect(url).not.toContain("api_key");
  });

  it("reports a rate limit as unverified with an action, not as a clean miss", async () => {
    vi.mocked(getJson).mockRejectedValue(new HttpError(429, "HTTP 429"));

    const result = await validateReferenceWithOpenalex(reference as never);

    expect(result.status).toBe("verification_unavailable");
    expect(result.verified).toBe(false);
    expect(String(result.message)).toContain("rate-limited");
    expect(String(result.message)).toContain("unverified, not confirmed correct");
    expect(String(result.how_to_fix)).toContain("Re-run the audit in a minute");
  });
});

describe("OpenAlex verification compares metadata, not just presence", () => {
  it("reports verified when every field agrees with the record", async () => {
    vi.mocked(getJson).mockResolvedValueOnce(work);
    const result = await validateReferenceWithOpenalex(reference as never);
    expect(result.status).toBe("verified");
    expect(result.discrepancies).toEqual([]);
    expect(result.canonical_venue).toBe("Nature");
    expect(result.canonical_pages).toBe("436-444");
  });

  it("catches a wrong title, journal, volume, and page range", async () => {
    vi.mocked(getJson).mockResolvedValueOnce(work);
    const result = await validateReferenceWithOpenalex({
      ...reference,
      parsed_title: "Deep learning for everything",
      parsed_journal: "Science",
      parsed_volume: "999",
      parsed_pages: "1-2",
    } as never);

    expect(result.status).toBe("discrepancies_found");
    const fields = (result.discrepancies as Array<{ field: string }>).map((d) => d.field);
    expect(fields.sort()).toEqual(["journal", "pages", "title", "volume"]);
  });

  it("does not accept an unrelated search hit", async () => {
    vi.mocked(getJson)
      .mockRejectedValueOnce(new HttpError(404, "missing"))
      .mockResolvedValueOnce({ results: [{ title: "ImageNet classification with deep convolutional neural networks" }] });

    // The 404 must become "no DOI record" and fall through to a title search,
    // whose only hit does not match the reference title.
    const result = await validateReferenceWithOpenalex({
      ...reference,
      parsed_title: "Zxqvth citation resonance in non-existent underwater libraries",
      parsed_doi: "10.9999/does-not-exist",
    } as never);
    expect(result.status).toBe("not_found");
    expect(result.verified).toBe(false);
  });

  it("reports the provider's retraction flag", async () => {
    vi.mocked(getJson).mockResolvedValueOnce({ ...work, is_retracted: true });
    const result = await validateReferenceWithOpenalex(reference as never);
    expect(result.is_retracted).toBe(true);
  });

  it("skips a book review of the cited work and verifies against the work itself", async () => {
    // Live behaviour for Bishop 2006: `title.search` returns the Kybernetes
    // review (2007, its own venue/volume/pages) before the Springer book.
    vi.mocked(getJson).mockResolvedValueOnce({
      results: [
        {
          type: "book-review",
          title: "Pattern Recognition and Machine Learning",
          publication_year: 2007,
          primary_location: { source: { display_name: "Kybernetes" } },
          biblio: { volume: "36", first_page: "275", last_page: "275" },
        },
        {
          type: "book",
          title: "Pattern Recognition and Machine Learning",
          publication_year: 2006,
          primary_location: { source: { display_name: "Springer" } },
          biblio: { volume: "", first_page: "", last_page: "" },
        },
      ],
    });

    const result = await validateReferenceWithOpenalex({
      parsed_title: "Pattern recognition and machine learning",
      parsed_journal: "",
      parsed_volume: "",
      parsed_pages: "",
      parsed_doi: null,
      parsed_year: 2006,
      parsed_authors: [],
    } as never);

    expect(result.status).toBe("verified");
    expect(result.discrepancies).toEqual([]);
    expect(result.canonical_year).toBe(2006);
    expect(result.canonical_venue).toBe("Springer");
    expect(result.canonical_pages).toBe("");
  });
});
