import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  calculateCustomer360Metrics,
  containsRawCustomerPii,
  growthCustomer360Dataset,
  maskCustomerProfile,
  mutateCustomer360Dataset,
  seedCustomer360Dataset,
  seedCustomerRecords,
  summarizeCustomer360,
  validateCustomer360Dataset,
  type Customer360Dataset
} from "../src/index.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const publicDataRoot = resolve(testDir, "../../../apps/customer360-template/public/data");

describe("legacy customer360 summary", () => {
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

describe("customer360 synthetic metric layer", () => {
  it("validates the built-in synthetic customers, orders, events, and returns", () => {
    const validation = validateCustomer360Dataset(seedCustomer360Dataset);

    expect(validation).toEqual({
      ok: true,
      errors: [],
      warnings: []
    });
  });

  it("calculates required PRD metrics from the synthetic seed", () => {
    const metrics = calculateCustomer360Metrics(seedCustomer360Dataset);

    expect(metrics.kpis).toMatchObject({
      revenue: 50900,
      grossRevenue: 51850,
      returnedRevenue: 950,
      averageOrderValue: 3635.71,
      repeatPurchaseRate: 0.63,
      purchaseFrequency: 1.75,
      returnRate: 0.21,
      activeCustomers: 8,
      totalCustomers: 8,
      orderCount: 14,
      returnCount: 3,
      highRiskCustomers: 1
    });
    expect(metrics.segmentRevenue.find((segment) => segment.segment === "Enterprise")?.revenue).toBe(42400);
    expect(metrics.segmentRevenue.find((segment) => segment.segment === "Mid-Market")?.revenue).toBe(7000);
    expect(metrics.topCategories[0]).toMatchObject({
      productCategory: "Automation",
      revenue: 21400,
      customerCount: 4
    });
    expect(metrics.behaviorFunnel.map((stage) => stage.customerCount)).toEqual([8, 8, 7, 5, 5]);
    expect(metrics.retentionCohorts).toHaveLength(6);
    expect(metrics.churnRisk[0]).toMatchObject({
      customerId: "CUS-1003",
      riskTier: "high"
    });
    expect(metrics.topOpportunities.length).toBeGreaterThanOrEqual(4);
    expect(metrics.dataFreshness).toMatchObject({
      latestOrderAt: "2026-06-21T00:00:00.000Z",
      latestEventAt: "2026-06-21T13:16:00.000Z",
      latestReturnAt: "2026-05-25T00:00:00.000Z",
      isStale: true
    });
  });

  it("masks renderable customer labels and contact fields by default", () => {
    const masked = maskCustomerProfile(seedCustomer360Dataset.customers[0]!);
    const metrics = calculateCustomer360Metrics(seedCustomer360Dataset);

    expect(masked.label).toBe("A. M. (CUS-1001)");
    expect(masked.email).toBe("a***@example.invalid");
    expect(masked.phone).toBe("***-***-0101");
    expect(containsRawCustomerPii(masked)).toBe(false);
    expect(containsRawCustomerPii(metrics.maskedCustomers)).toBe(false);
    expect(containsRawCustomerPii(metrics.churnRisk)).toBe(false);
  });

  it("returns safe zero metrics for empty but schema-valid data", () => {
    const emptyDataset: Customer360Dataset = {
      metadata: {
        datasetId: "empty",
        seed: 0,
        scenario: "baseline",
        generatedAt: "2026-06-28T10:00:00.000Z",
        piiPolicy: "mask_email_name_phone",
        source: "synthetic"
      },
      customers: [],
      orders: [],
      events: [],
      returns: []
    };

    const validation = validateCustomer360Dataset(emptyDataset);
    const metrics = calculateCustomer360Metrics(emptyDataset);

    expect(validation.ok).toBe(true);
    expect(validation.warnings.length).toBeGreaterThan(0);
    expect(metrics.kpis).toMatchObject({
      revenue: 0,
      averageOrderValue: 0,
      repeatPurchaseRate: 0,
      purchaseFrequency: 0,
      returnRate: 0,
      activeCustomers: 0,
      totalCustomers: 0
    });
    expect(metrics.behaviorFunnel.map((stage) => stage.customerCount)).toEqual([0, 0, 0, 0, 0]);
  });

  it("reports schema-like errors for missing arrays and broken references", () => {
    expect(validateCustomer360Dataset({}).errors).toEqual(
      expect.arrayContaining([
        "metadata must be an object",
        "customers must be an array",
        "orders must be an array",
        "events must be an array",
        "returns must be an array"
      ])
    );

    const invalidDataset = {
      ...seedCustomer360Dataset,
      orders: [
        {
          ...seedCustomer360Dataset.orders[0],
          orderId: "ORD-BROKEN",
          customerId: "CUS-MISSING"
        }
      ]
    };

    expect(validateCustomer360Dataset(invalidDataset).errors).toContain(
      "orders[0].customerId references missing customer CUS-MISSING"
    );
  });

  it("creates deterministic alternate seeds that change refresh-sensitive metrics", () => {
    const firstMutation = mutateCustomer360Dataset(seedCustomer360Dataset, {
      seed: 42,
      generatedAt: "2026-06-29T10:00:00.000Z"
    });
    const secondMutation = mutateCustomer360Dataset(seedCustomer360Dataset, {
      seed: 42,
      generatedAt: "2026-06-29T10:00:00.000Z"
    });

    expect(firstMutation).toEqual(secondMutation);
    expect(firstMutation.metadata.datasetId).toContain("mutated");
    expect(calculateCustomer360Metrics(firstMutation).kpis.revenue).not.toBe(
      calculateCustomer360Metrics(seedCustomer360Dataset).kpis.revenue
    );
    expect(calculateCustomer360Metrics(firstMutation).kpis.orderCount).toBe(15);
    expect(calculateCustomer360Metrics(growthCustomer360Dataset).kpis.revenue).not.toBe(
      calculateCustomer360Metrics(seedCustomer360Dataset).kpis.revenue
    );
  });
});

describe("customer360 public data files", () => {
  it("ships validated baseline and alternate public datasets for the template", () => {
    const baseline = readPublicDataset("customer360-baseline.json");
    const growth = readPublicDataset("customer360-growth.json");

    expect(validateCustomer360Dataset(baseline).ok).toBe(true);
    expect(validateCustomer360Dataset(growth).ok).toBe(true);
    expect(calculateCustomer360Metrics(growth).kpis.revenue).not.toBe(calculateCustomer360Metrics(baseline).kpis.revenue);
  });
});

function readPublicDataset(fileName: string): Customer360Dataset {
  return JSON.parse(readFileSync(resolve(publicDataRoot, fileName), "utf8")) as Customer360Dataset;
}
