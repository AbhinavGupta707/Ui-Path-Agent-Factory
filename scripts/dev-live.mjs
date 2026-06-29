#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const env = {
  ...process.env,
  ...readEnvFile(".env"),
  ...readEnvFile(".env.local")
};

const factoryApiPort = env.FACTORY_API_PORT || "8887";
const buildWorkerPort = env.BUILD_WORKER_PORT || "8890";
const consolePort = portFromUrl(env.FACTORY_CONSOLE_URL) || "5183";
const customerPort = portFromUrl(env.CUSTOMER360_TEMPLATE_URL) || "5184";

env.FACTORY_API_PORT = factoryApiPort;
env.BUILD_WORKER_PORT = buildWorkerPort;
env.VITE_FACTORY_API_BASE_URL = env.VITE_FACTORY_API_BASE_URL || `http://localhost:${factoryApiPort}`;
env.CUSTOMER360_TEMPLATE_URL = env.CUSTOMER360_TEMPLATE_URL || `http://localhost:${customerPort}`;
env.CUSTOMER360_DEPLOYMENT_URL = env.CUSTOMER360_DEPLOYMENT_URL || env.CUSTOMER360_TEMPLATE_URL;
env.DEPLOYMENT_SERVICE_BASE_URL = env.DEPLOYMENT_SERVICE_BASE_URL || `http://localhost:${factoryApiPort}`;

const noBuild = process.argv.includes("--no-build");
if (!noBuild) {
  runChecked("Build shared contracts", "npm", ["--workspace", "@agent-factory/shared-contracts", "run", "build"]);
  runChecked("Build Customer360 metrics", "npm", ["--workspace", "@agent-factory/customer360-metrics", "run", "build"]);
  runChecked("Build Factory API", "npm", ["--workspace", "@agent-factory/factory-api", "run", "build"]);
  runChecked("Build Build Worker", "npm", ["--workspace", "@agent-factory/build-worker", "run", "build"]);
}

const services = [
  {
    label: "api",
    command: "npm",
    args: ["run", "dev:api"],
    env
  },
  {
    label: "worker",
    command: "npm",
    args: ["run", "dev:worker"],
    env
  },
  {
    label: "console",
    command: "npm",
    args: [
      "--workspace",
      "@agent-factory/factory-console",
      "exec",
      "vite",
      "--",
      "--host",
      "0.0.0.0",
      "--port",
      consolePort
    ],
    env
  },
  {
    label: "customer360",
    command: "npm",
    args: [
      "--workspace",
      "@agent-factory/customer360-template",
      "exec",
      "vite",
      "--",
      "--host",
      "0.0.0.0",
      "--port",
      customerPort
    ],
    env
  }
];

console.log("\nStarting Agent Factory live local stack");
console.log(`Factory API:       http://localhost:${factoryApiPort}`);
console.log(`Build Worker:      http://localhost:${buildWorkerPort}`);
console.log(`Factory Console:   http://localhost:${consolePort}`);
console.log(`Customer360:       http://localhost:${customerPort}`);
console.log("\nPress Ctrl+C to stop all services.\n");

const children = services.map(startService);

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));
process.on("exit", () => {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
});

function startService(service) {
  const child = spawn(service.command, service.args, {
    env: service.env,
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout.on("data", (chunk) => prefix(service.label, chunk));
  child.stderr.on("data", (chunk) => prefix(service.label, chunk));
  child.on("error", (error) => {
    console.error(`[${service.label}] ${error.message}`);
    stopAll();
  });
  child.on("exit", (code, signal) => {
    if (stopping) {
      return;
    }
    console.error(`[${service.label}] exited with ${signal ?? code}`);
    stopAll(code || 1);
  });

  return child;
}

let stopping = false;
function stopAll(code = 0) {
  if (stopping) {
    return;
  }
  stopping = true;
  const exitCode = typeof code === "number" ? code : 0;
  console.log("\nStopping Agent Factory live local stack...");
  for (const child of children) {
    child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(exitCode), 400);
}

function prefix(label, chunk) {
  for (const line of chunk.toString("utf8").split(/\r?\n/)) {
    if (line.length > 0) {
      console.log(`[${label}] ${line}`);
    }
  }
}

function runChecked(label, command, args) {
  console.log(`==> ${label}`);
  const result = spawnSync(command, args, {
    env,
    stdio: "inherit"
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`${label} failed with exit code ${result.status}.`);
    process.exit(result.status ?? 1);
  }
}

function readEnvFile(path) {
  if (!existsSync(path)) {
    return {};
  }

  const values = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const index = trimmed.indexOf("=");
    if (index === -1) {
      continue;
    }
    values[trimmed.slice(0, index).trim()] = unquote(trimmed.slice(index + 1).trim());
  }
  return values;
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function portFromUrl(value) {
  if (!value) {
    return undefined;
  }
  try {
    return new URL(value).port;
  } catch {
    return undefined;
  }
}
