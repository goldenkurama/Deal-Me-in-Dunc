import { describe, expect, it } from "vitest";
import { DEALER_CODES, normalizeDealerAnswer } from "../src/config/dealerCodes";

describe("dealer code normalization", () => {
  it("is case-insensitive and collapses spaces", () => {
    expect(normalizeDealerAnswer("  GLASS   CANNON ")).toBe("glass cannon");
  });

  it("normalizes curly apostrophes", () => {
    expect(normalizeDealerAnswer("It’s chewsday innit")).toBe("it's chewsday innit");
  });

  it("retains the configured Saturday alternate response", () => {
    expect(DEALER_CODES.saturday.alternateAnswers?.["like a plastic bag"]).toBeDefined();
  });
});
