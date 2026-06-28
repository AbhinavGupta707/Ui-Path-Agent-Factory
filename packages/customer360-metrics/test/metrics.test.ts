import { describe, expect, it } from "vitest";
import { seedCustomerRecords, summarizeCustomer360 } from "../src/index.js";

describe("customer360 metrics", () => {
  it("summarizes the seeded account portfolio", () => {
    const summary = summarizeCustomer360(seedCustomerRecords);

    expect(summary.totalArr).toBe(1042000);
    expect(summary.averageHealthScore).toBe(80);
    expect(summary.accountsAtRisk).toBe(1);
    expect(summary.expansionCandidates).toBe(2);
  });

  it("returns a zero summary for empty inputs", () => {
    expect(summarizeCustomer360([])).toEqual({
      totalArr: 0,
      averageHealthScore: 0,
      accountsAtRisk: 0,
      expansionCandidates: 0,
      segmentArr: {
        Enterprise: 0,
        "Mid-Market": 0,
        Commercial: 0
      }
    });
  });
});
