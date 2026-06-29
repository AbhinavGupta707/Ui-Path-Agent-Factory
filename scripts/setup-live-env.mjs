#!/usr/bin/env node
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { stdin, stdout } from "node:process";
import readline from "node:readline/promises";
import { Writable } from "node:stream";

class MuteableOutput extends Writable {
  muted = false;

  _write(chunk, encoding, callback) {
    if (!this.muted) {
      stdout.write(chunk, encoding);
    }
    callback();
  }
}

const ENV_PATH = ".env.local";
const managedKeys = [
  "FIREWORKS_API_KEY",
  "LANGSMITH_TRACING",
  "LANGSMITH_API_KEY",
  "LANGSMITH_PROJECT",
  "LANGSMITH_ENDPOINT",
  "GITHUB_PAT_TOKEN",
  "FACTORY_API_PORT",
  "BUILD_WORKER_PORT",
  "FACTORY_CONSOLE_URL",
  "CUSTOMER360_TEMPLATE_URL",
  "CUSTOMER360_DEPLOYMENT_URL",
  "DEPLOYMENT_SERVICE_BASE_URL",
  "FIREWORKS_TIMEOUT_MS",
  "AGENT_FACTORY_ENABLE_PRODUCTION_DEPLOYMENT",
  "AGENT_FACTORY_ALLOW_VERCEL_PREVIEW",
  "AGENT_MODEL_FAST",
  "AGENT_MODEL_REASONING",
  "AGENT_MODEL_CODE",
  "AGENT_MODEL_FALLBACK"
];

const defaults = {
  LANGSMITH_TRACING: "true",
  LANGSMITH_PROJECT: "agent-factory-live",
  LANGSMITH_ENDPOINT: "https://api.smith.langchain.com",
  FACTORY_API_PORT: "8887",
  BUILD_WORKER_PORT: "8890",
  FACTORY_CONSOLE_URL: "http://localhost:5183",
  CUSTOMER360_TEMPLATE_URL: "http://localhost:5184",
  CUSTOMER360_DEPLOYMENT_URL: "http://localhost:5184",
  DEPLOYMENT_SERVICE_BASE_URL: "http://localhost:8887",
  FIREWORKS_TIMEOUT_MS: "20000",
  AGENT_FACTORY_ENABLE_PRODUCTION_DEPLOYMENT: "false",
  AGENT_FACTORY_ALLOW_VERCEL_PREVIEW: "false",
  AGENT_MODEL_FAST: "",
  AGENT_MODEL_REASONING: "",
  AGENT_MODEL_CODE: "",
  AGENT_MODEL_FALLBACK: ""
};

const existing = parseEnvFile(ENV_PATH);
const output = new MuteableOutput();
const rl = readline.createInterface({
  input: stdin,
  output,
  terminal: Boolean(stdin.isTTY)
});

stdout.write("Agent Factory live setup\n");
stdout.write("Secrets are written to .env.local, which is ignored by git.\n");
stdout.write("Press Enter to keep an existing value or leave an optional value blank.\n\n");

const next = { ...existing };

next.FIREWORKS_API_KEY = await secret("Fireworks API key", existing.FIREWORKS_API_KEY);
next.LANGSMITH_API_KEY = await secret("LangSmith API key", existing.LANGSMITH_API_KEY);
next.GITHUB_PAT_TOKEN = await secret("GitHub PAT token (optional)", existing.GITHUB_PAT_TOKEN);

next.LANGSMITH_TRACING = await plain("Enable LangSmith tracing", existing.LANGSMITH_TRACING ?? defaults.LANGSMITH_TRACING);
next.LANGSMITH_PROJECT = await plain("LangSmith project", existing.LANGSMITH_PROJECT ?? defaults.LANGSMITH_PROJECT);
next.LANGSMITH_ENDPOINT = await plain("LangSmith endpoint", existing.LANGSMITH_ENDPOINT ?? defaults.LANGSMITH_ENDPOINT);

next.FACTORY_API_PORT = await plain("Factory API port", existing.FACTORY_API_PORT ?? defaults.FACTORY_API_PORT);
next.BUILD_WORKER_PORT = await plain("Build Worker port", existing.BUILD_WORKER_PORT ?? defaults.BUILD_WORKER_PORT);

const consolePort = portFromUrl(existing.FACTORY_CONSOLE_URL) ?? "5183";
const customerPort = portFromUrl(existing.CUSTOMER360_TEMPLATE_URL) ?? "5184";
next.FACTORY_CONSOLE_URL = await plain("Factory Console URL", existing.FACTORY_CONSOLE_URL ?? `http://localhost:${consolePort}`);
next.CUSTOMER360_TEMPLATE_URL = await plain(
  "Customer360 URL",
  existing.CUSTOMER360_TEMPLATE_URL ?? `http://localhost:${customerPort}`
);
next.CUSTOMER360_DEPLOYMENT_URL = await plain(
  "Customer360 deployment URL",
  existing.CUSTOMER360_DEPLOYMENT_URL ?? next.CUSTOMER360_TEMPLATE_URL
);
next.DEPLOYMENT_SERVICE_BASE_URL = await plain(
  "Deployment service URL",
  existing.DEPLOYMENT_SERVICE_BASE_URL ?? `http://localhost:${next.FACTORY_API_PORT}`
);
next.FIREWORKS_TIMEOUT_MS = await plain(
  "Fireworks timeout ms",
  existing.FIREWORKS_TIMEOUT_MS ?? defaults.FIREWORKS_TIMEOUT_MS
);

next.AGENT_FACTORY_ENABLE_PRODUCTION_DEPLOYMENT = "false";
next.AGENT_FACTORY_ALLOW_VERCEL_PREVIEW = existing.AGENT_FACTORY_ALLOW_VERCEL_PREVIEW ?? defaults.AGENT_FACTORY_ALLOW_VERCEL_PREVIEW;

next.AGENT_MODEL_FAST = await plain(
  "Fast model profile (optional, can fill after model discovery)",
  existing.AGENT_MODEL_FAST ?? defaults.AGENT_MODEL_FAST
);
next.AGENT_MODEL_REASONING = await plain(
  "Reasoning model profile (optional)",
  existing.AGENT_MODEL_REASONING ?? defaults.AGENT_MODEL_REASONING
);
next.AGENT_MODEL_CODE = await plain("Code model profile (optional)", existing.AGENT_MODEL_CODE ?? defaults.AGENT_MODEL_CODE);
next.AGENT_MODEL_FALLBACK = await plain(
  "Fallback model profile (optional)",
  existing.AGENT_MODEL_FALLBACK ?? defaults.AGENT_MODEL_FALLBACK
);

rl.close();

writeFileSync(ENV_PATH, serializeEnv(existing, next), "utf8");
chmodSync(ENV_PATH, 0o600);

stdout.write("\nSaved .env.local with git-ignored live configuration.\n");
stdout.write("Next command: npm run dev:live\n");

async function plain(label, current = "") {
  const suffix = current ? ` [${current}]` : "";
  const answer = (await rl.question(`${label}${suffix}: `)).trim();
  return answer || current;
}

async function secret(label, current = "") {
  const suffix = current ? " [already set]" : "";
  stdout.write(`${label}${suffix}: `);
  output.muted = true;
  const answer = (await rl.question("")).trim();
  output.muted = false;
  stdout.write("\n");
  return answer || current;
}

function serializeEnv(original, values) {
  const preserved = Object.entries(original).filter(([key]) => !managedKeys.includes(key));
  const lines = [
    "# Agent Factory live configuration",
    "# Generated by npm run setup:live. This file is ignored by git.",
    ""
  ];

  for (const key of managedKeys) {
    const value = values[key] ?? defaults[key] ?? "";
    lines.push(`${key}=${formatEnvValue(value)}`);
  }

  if (preserved.length > 0) {
    lines.push("", "# Preserved custom values");
    for (const [key, value] of preserved) {
      lines.push(`${key}=${formatEnvValue(value)}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function formatEnvValue(value) {
  if (!/[#\s"'\\]/.test(value)) {
    return value;
  }

  return JSON.stringify(value);
}

function parseEnvFile(path) {
  if (!existsSync(path)) {
    return {};
  }

  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const index = trimmed.indexOf("=");
    if (index === -1) {
      continue;
    }

    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    env[key] = unquote(rawValue);
  }
  return env;
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
