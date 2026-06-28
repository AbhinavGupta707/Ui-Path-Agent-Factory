import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { seedCustomerRecords, summarizeCustomer360 } from "@agent-factory/customer360-metrics";

type RenderedNode = {
  tag: string;
  props: Record<string, unknown>;
  children: RenderedTree;
};

type RenderedTree = Array<RenderedNode | string>;

const rootMock = vi.hoisted(() => {
  const renderedRoots: unknown[] = [];

  return {
    renderedRoots,
    createRoot: vi.fn(() => ({
      render: vi.fn((node: unknown) => {
        renderedRoots.push(node);
      })
    }))
  };
});

vi.mock("react-dom/client", () => ({
  createRoot: rootMock.createRoot
}));

async function renderDashboard() {
  rootMock.renderedRoots.length = 0;
  rootMock.createRoot.mockClear();
  vi.resetModules();
  vi.stubGlobal("document", {
    getElementById: vi.fn((id: string) => (id === "root" ? { id } : null))
  });

  await import("../src/main.tsx");

  expect(rootMock.renderedRoots).toHaveLength(1);

  const tree = materialize(rootMock.renderedRoots[0]);
  return {
    tree,
    text: flattenText(tree)
  };
}

function materialize(node: unknown): RenderedTree {
  if (Array.isArray(node)) {
    return node.flatMap((child) => materialize(child));
  }

  if (node === null || node === undefined || typeof node === "boolean") {
    return [];
  }

  if (typeof node === "string" || typeof node === "number") {
    return [String(node)];
  }

  if (!React.isValidElement(node)) {
    return [];
  }

  const props = node.props as Record<string, unknown>;
  const elementType = node.type;

  if (typeof elementType === "function") {
    return materialize(elementType(props));
  }

  if (typeof elementType === "string") {
    return [
      {
        tag: elementType,
        props,
        children: materialize(props.children)
      }
    ];
  }

  return materialize(props.children);
}

function flattenText(tree: RenderedTree): string {
  return tree
    .flatMap((node) => (typeof node === "string" ? [node] : [flattenText(node.children)]))
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/\$\s+/g, "$")
    .trim();
}

function findNodes(
  tree: RenderedTree,
  predicate: (node: RenderedNode) => boolean
): RenderedNode[] {
  const matches: RenderedNode[] = [];

  for (const node of tree) {
    if (typeof node === "string") {
      continue;
    }

    if (predicate(node)) {
      matches.push(node);
    }

    matches.push(...findNodes(node.children, predicate));
  }

  return matches;
}

describe("Customer360 dashboard template", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the seeded dashboard metrics and customer account table", async () => {
    const summary = summarizeCustomer360(seedCustomerRecords);
    const { text, tree } = await renderDashboard();

    expect(text).toContain("Customer360 Dashboard");
    expect(text).toContain("Generated dashboard template seeded for the governed build workflow.");
    expect(text).toContain(`$${summary.totalArr.toLocaleString()}`);
    expect(text).toContain(String(summary.averageHealthScore));
    expect(text).toContain(String(summary.accountsAtRisk));
    expect(text).toContain(String(summary.expansionCandidates));

    const metricCards = findNodes(tree, (node) => node.tag === "article");
    expect(metricCards).toHaveLength(4);
    expect(text).toContain("Total ARR");
    expect(text).toContain("Average health");
    expect(text).toContain("At-risk accounts");
    expect(text).toContain("Expansion candidates");

    for (const record of seedCustomerRecords) {
      expect(text).toContain(record.account);
      expect(text).toContain(record.segment);
      expect(text).toContain(record.region);
      expect(text).toContain(`$${record.arr.toLocaleString()}`);
      expect(text).toContain(String(record.healthScore));
    }
  });

  it("keeps the rendered template free of raw contact PII", async () => {
    const { text } = await renderDashboard();

    expect(text).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(text).not.toMatch(/\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/);

    for (const record of seedCustomerRecords) {
      expect(record).not.toHaveProperty("email");
      expect(record).not.toHaveProperty("phone");
      expect(record).not.toHaveProperty("name");
    }
  });

  it("has a deterministic empty-data fallback and no required network data fetch", async () => {
    const fetchSpy = vi.fn(() => {
      throw new Error("The template smoke test must not fetch external data.");
    });
    vi.stubGlobal("fetch", fetchSpy);

    await renderDashboard();

    expect(fetchSpy).not.toHaveBeenCalled();
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

  it("proves seeded-data mutations change business output before refresh", () => {
    const baseline = summarizeCustomer360(seedCustomerRecords);
    const mutatedRecords = seedCustomerRecords.map((record, index) =>
      index === 0
        ? {
            ...record,
            arr: record.arr + 50000,
            healthScore: 64,
            openRisks: 4,
            productUsage: 65
          }
        : record
    );
    const mutated = summarizeCustomer360(mutatedRecords);

    expect(mutated.totalArr).toBe(baseline.totalArr + 50000);
    expect(mutated.averageHealthScore).toBeLessThan(baseline.averageHealthScore);
    expect(mutated.accountsAtRisk).toBeGreaterThan(baseline.accountsAtRisk);
    expect(mutated.expansionCandidates).toBeLessThan(baseline.expansionCandidates);
  });
});
