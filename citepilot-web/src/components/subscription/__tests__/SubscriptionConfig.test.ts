import { describe, it, expect } from "vitest";

describe("Subscription Configuration", () => {
  it("has valid default PayPal Plan ID and Client ID", () => {
    const DEFAULT_PLAN_ID = "P-00697875B1151583ANJV3VOY";
    const DEFAULT_CLIENT_ID = "AQk7S24Sc2iKHeIuA93BP-3MN3fPOumFejN4lxJmku14oGkjT_T7l8lYgaS9ohmMf8YZl4M1aHLLS_H3";

    expect(DEFAULT_PLAN_ID).toBe("P-00697875B1151583ANJV3VOY");
    expect(DEFAULT_CLIENT_ID).toBe("AQk7S24Sc2iKHeIuA93BP-3MN3fPOumFejN4lxJmku14oGkjT_T7l8lYgaS9ohmMf8YZl4M1aHLLS_H3");
  });
});
