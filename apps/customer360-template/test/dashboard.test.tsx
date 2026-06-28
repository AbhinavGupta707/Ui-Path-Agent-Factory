import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  calculateCustomer360Metrics,
  containsRawCustomerPii,
  mutateCustomer360Dataset,
  seedCustomer360Dataset
} from "@agent-factory/customer360-metrics";
import { App, buildDashboardModel, datasetForMode } from "../src/main.js";

function renderText(node: React.ReactElement): string {
  return renderToStaticMarkup(node)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

describe("Customer360 dashboard template", () => {
  it("renders the enriched Customer360 dashboard from the metric layer", () => {
    const model = buildDashboardModel(seedCustomer360Dataset);
    const text = renderText(<App />);

    expect(text).toContain("Customer360 Insight Dashboard");
    expect(text).toContain("Revenue, retention, and risk analytics.");
    expect(text).toContain(model.kpis[0]?.value);
    expect(text).toContain(model.kpis[1]?.value);
    expect(text).toContain(model.kpis[2]?.value);
    expect(text).toContain("Segment revenue");
    expect(text).toContain("Retention proxy");
    expect(text).toContain("Behaviour funnel");
    expect(text).toContain("Category mix");
    expect(text).toContain("Churn risk and opportunities");
    expect(text).toContain(model.risks[0]?.id);
    expect(text).toContain(model.categories[0]?.name);
  });

  it("keeps rendered output free of raw contact PII", () => {
    const text = renderText(<App />);

    expect(text).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(text).not.toMatch(/\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/);
    expect(containsRawCustomerPii(text)).toBe(false);

    for (const customer of seedCustomer360Dataset.customers) {
      expect(text).not.toContain(`${customer.firstName} ${customer.lastName}`);
      expect(text).not.toContain(customer.email);
      expect(text).not.toContain(customer.phone);
    }
  });

  it("supports empty and degraded data states without required network fetches", () => {
    const fetchSpy = vi.fn(() => {
      throw new Error("The template smoke test must not fetch external data.");
    });
    vi.stubGlobal("fetch", fetchSpy);

    const emptyModel = buildDashboardModel(datasetForMode("empty", 0, "2026-06-29T10:00:00.000Z"));
    const degradedModel = buildDashboardModel(datasetForMode("degraded", 0, "2026-06-29T10:00:00.000Z"));

    renderText(<App />);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(emptyModel.kpis[0]?.value).toBe("$0");
    expect(emptyModel.freshness.rowCounts).toEqual({
      customers: 0,
      orders: 0,
      events: 0,
      returns: 0
    });
    expect(emptyModel.warnings.length).toBeGreaterThan(0);
    expect(degradedModel.freshness.rowCounts.returns).toBe(0);
    expect(degradedModel.kpis[3]?.value).toBe("0%");
  });

  it("proves deterministic refresh mutation changes business output", () => {
    const baseline = calculateCustomer360Metrics(seedCustomer360Dataset);
    const firstMutation = datasetForMode("ready", 1, "2026-06-29T10:00:00.000Z");
    const secondMutation = mutateCustomer360Dataset(seedCustomer360Dataset, {
      seed: 20260716,
      generatedAt: "2026-06-29T10:00:00.000Z",
      scenario: "mutated"
    });
    const mutated = calculateCustomer360Metrics(firstMutation);

    expect(firstMutation).toEqual(secondMutation);
    expect(mutated.kpis.revenue).not.toBe(baseline.kpis.revenue);
    expect(mutated.kpis.orderCount).toBe(baseline.kpis.orderCount + 1);
    expect(mutated.dataFreshness.generatedAt).toBe("2026-06-29T10:00:00.000Z");
  });
});
