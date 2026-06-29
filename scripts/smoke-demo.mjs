#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const checks = [
  {
    label: "Reset deterministic demo state",
    command: process.execPath,
    args: ["scripts/reset-demo-state.mjs", "--clean", "--quiet"]
  },
  {
    label: "Run privacy/security scan",
    command: process.execPath,
    args: ["scripts/privacy-security-scan.mjs"]
  },
  {
    label: "Build shared contracts",
    command: "npm",
    args: ["--workspace", "@agent-factory/shared-contracts", "run", "build"]
  },
  {
    label: "Build Customer360 metrics",
    command: "npm",
    args: ["--workspace", "@agent-factory/customer360-metrics", "run", "build"]
  },
  {
    label: "Factory API lifecycle tests",
    command: "npm",
    args: ["--workspace", "@agent-factory/factory-api", "run", "test"]
  },
  {
    label: "Build worker smoke",
    command: "npm",
    args: ["run", "smoke:build-worker"]
  },
  {
    label: "Factory Console typecheck",
    command: "npm",
    args: ["--workspace", "@agent-factory/factory-console", "run", "typecheck"]
  },
  {
    label: "Factory Console build",
    command: "npm",
    args: ["--workspace", "@agent-factory/factory-console", "run", "build"]
  },
  {
    label: "Customer360 dashboard smoke",
    command: "npm",
    args: ["run", "smoke:customer360"]
  }
];

const childEnv = sanitizedDemoEnv();

for (const check of checks) {
  console.log(`\n==> ${check.label}`);
  const result = spawnSync(check.command, check.args, {
    env: childEnv,
    stdio: "inherit"
  });

  if (result.error) {
    console.error(`Unable to start ${check.command}: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`${check.label} failed with exit code ${result.status}.`);
    process.exit(result.status ?? 1);
  }
}

console.log("\nDemo smoke passed without requiring secrets, live UiPath mutation, or external deployment.");

function sanitizedDemoEnv() {
  const sensitiveKeyPattern = /(TOKEN|SECRET|PASSWORD|PASSWD|API[_-]?KEY|ACCESS[_-]?KEY|PRIVATE[_-]?KEY|AUTH|CREDENTIAL|OPENAI|UIPATH|GITHUB|VERCEL)/i;
  const env = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (sensitiveKeyPattern.test(key)) {
      continue;
    }
    env[key] = value;
  }

  env.CI = process.env.CI ?? "1";
  return env;
}
