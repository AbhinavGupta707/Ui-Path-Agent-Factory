#!/usr/bin/env node
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = parseArgs(process.argv.slice(2));
const stateDir = resolve(args.dir ?? join(tmpdir(), "agent-factory-demo-state"));
const seed = Number(args.seed ?? 20260715);
const generatedAt = args.generatedAt ?? "2026-06-29T10:00:00.000Z";

if (!Number.isFinite(seed)) {
  throw new Error("--seed must be a finite number");
}

const baselinePath = resolve(repoRoot, args.baseline ?? "apps/customer360-template/public/data/customer360-baseline.json");
const currentPath = resolve(stateDir, "customer360-current.json");
const mutatedPath = resolve(stateDir, "customer360-mutated.json");
const evidencePath = resolve(stateDir, "demo-state.json");

if (args.clean !== "false") {
  await rm(stateDir, { force: true, recursive: true });
}

const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
assertSyntheticMaskedDataset(baseline, baselinePath);

const current = {
  ...baseline,
  metadata: {
    ...baseline.metadata,
    generatedAt,
    scenario: "baseline"
  }
};
const mutated = mutateDataset(baseline, { generatedAt, seed });

await mkdir(stateDir, { recursive: true });
await writeJson(currentPath, current);
await writeJson(mutatedPath, mutated);

const evidence = {
  stateDir,
  resetFile: currentPath,
  mutatedFile: mutatedPath,
  baselineSource: baselinePath,
  seed,
  generatedAt,
  current: summarizeDataset(current),
  mutated: summarizeDataset(mutated),
  checks: {
    syntheticOnly: current.metadata.source === "synthetic" && mutated.metadata.source === "synthetic",
    piiPolicy: current.metadata.piiPolicy,
    mutationChangesOrderCount: mutated.orders.length === current.orders.length + 1,
    mutationChangesEventCount: mutated.events.length === current.events.length + 2
  }
};

await writeJson(evidencePath, evidence);

if (!args.quiet) {
  console.log(JSON.stringify(evidence, null, 2));
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token?.startsWith("--")) {
      continue;
    }

    const [rawKey, inlineValue] = token.slice(2).split("=");
    const nextValue = argv[index + 1];
    const value = inlineValue ?? (nextValue && !nextValue.startsWith("--") ? nextValue : "true");
    parsed[rawKey] = value;

    if (inlineValue === undefined && value === nextValue) {
      index += 1;
    }
  }
  return parsed;
}

function assertSyntheticMaskedDataset(dataset, sourcePath) {
  const metadata = dataset?.metadata ?? {};
  const issues = [];

  if (metadata.source !== "synthetic") {
    issues.push("metadata.source must be synthetic");
  }
  if (metadata.piiPolicy !== "mask_email_name_phone") {
    issues.push("metadata.piiPolicy must be mask_email_name_phone");
  }
  for (const key of ["customers", "orders", "events", "returns"]) {
    if (!Array.isArray(dataset[key])) {
      issues.push(`${key} must be an array`);
    }
  }

  if (issues.length > 0) {
    throw new Error(`Demo dataset ${sourcePath} is not rehearsal-safe: ${issues.join("; ")}`);
  }
}

function mutateDataset(dataset, options) {
  const random = seededRandom(options.seed);
  const customers = Array.isArray(dataset.customers) ? dataset.customers : [];
  const customer = customers[Math.floor(random() * Math.max(1, customers.length))] ?? customers[0];
  const categories = ["Analytics", "Automation", "Insights", "Commerce", "Support"];
  const productCategory = categories[Math.floor(random() * categories.length)] ?? "Analytics";
  const amount = 1200 + Math.floor(random() * 4800);
  const discount = Math.floor(random() * 4) * 50;
  const suffix = String(options.seed).slice(-5);

  if (!customer) {
    return {
      ...dataset,
      metadata: {
        ...dataset.metadata,
        datasetId: `${dataset.metadata?.datasetId ?? "customer360"}-mutated-${suffix}`,
        generatedAt: options.generatedAt,
        scenario: "mutated",
        seed: options.seed
      }
    };
  }

  return {
    ...dataset,
    metadata: {
      ...dataset.metadata,
      datasetId: `${dataset.metadata?.datasetId ?? "customer360"}-mutated-${suffix}`,
      generatedAt: options.generatedAt,
      scenario: "mutated",
      seed: options.seed
    },
    orders: [
      ...(Array.isArray(dataset.orders) ? dataset.orders : []),
      {
        orderId: `ORD-M${suffix}`,
        customerId: customer.customerId,
        orderDate: options.generatedAt.slice(0, 10),
        productCategory,
        amount,
        discount,
        channel: "Web"
      }
    ],
    events: [
      ...(Array.isArray(dataset.events) ? dataset.events : []),
      {
        eventId: `EVT-M${suffix}-1`,
        customerId: customer.customerId,
        eventType: "visit",
        productCategory,
        source: "refresh-proof",
        timestamp: options.generatedAt
      },
      {
        eventId: `EVT-M${suffix}-2`,
        customerId: customer.customerId,
        eventType: "purchase",
        productCategory,
        source: "refresh-proof",
        timestamp: options.generatedAt
      }
    ],
    returns: Array.isArray(dataset.returns) ? dataset.returns : []
  };
}

function seededRandom(seedValue) {
  let state = seedValue % 2147483647;
  if (state <= 0) {
    state += 2147483646;
  }
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function summarizeDataset(dataset) {
  return {
    datasetId: dataset.metadata.datasetId,
    generatedAt: dataset.metadata.generatedAt,
    scenario: dataset.metadata.scenario,
    rowCounts: {
      customers: dataset.customers.length,
      orders: dataset.orders.length,
      events: dataset.events.length,
      returns: dataset.returns.length
    }
  };
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
