#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));
const inputPath = resolve(args.in ?? "apps/customer360-template/public/data/customer360-baseline.json");
const outputPath = resolve(args.out ?? "apps/customer360-template/public/data/customer360-current.json");
const seed = Number(args.seed ?? 20260715);

if (!Number.isFinite(seed)) {
  throw new Error("--seed must be a finite number");
}

const input = JSON.parse(await readFile(inputPath, "utf8"));
const mutated = mutateDataset(input, {
  seed,
  generatedAt: args.generatedAt
});

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(mutated, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      output: outputPath,
      datasetId: mutated.metadata.datasetId,
      seed: mutated.metadata.seed,
      orders: mutated.orders.length,
      events: mutated.events.length,
      generatedAt: mutated.metadata.generatedAt
    },
    null,
    2
  )
);

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

function mutateDataset(dataset, options) {
  const random = seededRandom(options.seed);
  const customers = Array.isArray(dataset.customers) ? dataset.customers : [];
  const customer = customers[Math.floor(random() * Math.max(1, customers.length))] ?? customers[0];
  const categories = ["Analytics", "Automation", "Insights", "Commerce", "Support"];
  const productCategory = categories[Math.floor(random() * categories.length)] ?? "Analytics";
  const amount = 1200 + Math.floor(random() * 4800);
  const discount = Math.floor(random() * 4) * 50;
  const generatedAt = options.generatedAt ?? addDays(dataset.metadata?.generatedAt ?? "2026-06-28T10:00:00.000Z", 1);
  const suffix = String(options.seed).slice(-5);

  if (!customer) {
    return {
      ...dataset,
      metadata: {
        ...dataset.metadata,
        datasetId: `${dataset.metadata?.datasetId ?? "customer360"}-mutated-${suffix}`,
        seed: options.seed,
        scenario: "mutated",
        generatedAt
      }
    };
  }

  return {
    ...dataset,
    metadata: {
      ...dataset.metadata,
      datasetId: `${dataset.metadata?.datasetId ?? "customer360"}-mutated-${suffix}`,
      seed: options.seed,
      scenario: "mutated",
      generatedAt
    },
    orders: [
      ...(Array.isArray(dataset.orders) ? dataset.orders : []),
      {
        orderId: `ORD-M${suffix}`,
        customerId: customer.customerId,
        orderDate: generatedAt.slice(0, 10),
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
        timestamp: generatedAt,
        eventType: "visit",
        productCategory,
        source: "refresh-proof"
      },
      {
        eventId: `EVT-M${suffix}-2`,
        customerId: customer.customerId,
        timestamp: generatedAt,
        eventType: "purchase",
        productCategory,
        source: "refresh-proof"
      }
    ],
    returns: Array.isArray(dataset.returns) ? dataset.returns : []
  };
}

function seededRandom(seed) {
  let state = seed % 2147483647;
  if (state <= 0) {
    state += 2147483646;
  }
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function addDays(value, days) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}
