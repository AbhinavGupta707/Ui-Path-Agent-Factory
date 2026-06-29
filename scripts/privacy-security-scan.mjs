#!/usr/bin/env node
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const jsonOutput = args.has("--json");
const strict = args.has("--strict");

const scanRoots = [
  "README.md",
  "docs",
  "apps/factory-console/src",
  "apps/customer360-template/src",
  "services/factory-api/src",
  "services/build-worker/src",
  "services/build-worker/prompts",
  "scripts"
];

const excludedPathPatterns = [
  /^docs\/orchestration\/worker-prompts\//,
  /^docs\/orchestration\/checkpoint-[1-4]\//,
  /^scripts\/privacy-security-scan\.mjs$/,
  /\/test\//,
  /\.test\.[cm]?[jt]sx?$/
];

const rules = [
  {
    id: "stale_pre_orchestration_copy",
    severity: "warning",
    pattern: /pre-orchestration scaffold/gi,
    allowContext: /checkpoint-5-final-qa-e2e/i,
    message: "Stale pre-CP5 scaffold wording remains visible."
  },
  {
    id: "raw_pii_claim",
    severity: "error",
    pattern: /\braw\s+PII\b|\braw\s+customer\s+PII\b/gi,
    allowContext:
      /\b(do not|never|no|not|without|block|blocked|mask|masked|redact|redacted|scan|guardrail|forbidden|avoid|free of|fails?|keeps?|policy|test|safe|question|requires)\b/i,
    message: "Raw PII is mentioned without a blocking, masking, testing, or redaction context."
  },
  {
    id: "secret_or_env_read_claim",
    severity: "error",
    pattern: /\b(read|access|load|print|log|expose|display|use)\b[^\n]{0,120}\b(secret|credential|token|keychain|browser storage|\.env)\b/gi,
    allowPath: /\/redaction\.ts$/,
    allowContext:
      /\b(do not|never|no|not|without|block|blocked|forbid|forbidden|redact|redacted|scan|guardrail|avoid|outside|ignore|ignored|example|requires approval|must not|sensitiveKeyPattern|sanitized|x-agent-factory-bridge-token|access-control-allow-headers)\b/i,
    message: "Secret, credential, token, browser storage, or .env access is claimed without an explicit guardrail."
  },
  {
    id: "dotenv_access_claim",
    severity: "error",
    pattern: /(^|[^\w.])\.env(?:\b|[^\w])/gi,
    allowContext:
      /\b(do not|never|no|not|without|exclude|excluded|ignore|ignored|outside|forbid|forbidden|block|blocked|disallow|disallowed|avoid|example|commit|credentials?|values?|files?|local|guardrail|gitignore|readiness|basename|return false|safe)\b/i,
    message: ".env appears outside an allowed example, exclusion, or guardrail context."
  },
  {
    id: "production_deploy_claim",
    severity: "error",
    pattern: /\bproduction\s+deploy(?:ment|s|ed|ing)?\b|\bdeploy(?:ment|s|ed|ing)?\s+to\s+production\b/gi,
    allowContext:
      /\b(do not|never|no|not|without approval|requires explicit|unless explicitly|block|blocked|forbid|forbidden|disabled|non-goal|sandbox|approval|later live-platform)\b/i,
    message: "Production deployment is mentioned without an explicit approval or sandbox-only boundary."
  },
  {
    id: "unmasked_customer_display_claim",
    severity: "error",
    pattern: /\bunmasked\b|\bdisplay(?:ed|s|ing)?\b[^\n]{0,100}\b(customer names?|emails?|phones?|PII)\b|\bcustomer names?\/emails?\b[^\n]{0,80}\bdisplay/gi,
    allowContext:
      /\b(do not|never|no|not|without|block|blocked|mask|masked|tokenized|suppressed|question|should|forbidden|guardrail|safe|policy|productionIntent|policyViolations)\b/i,
    message: "Customer display wording does not make the masking boundary explicit."
  }
];

const files = await collectFiles();
const findings = [];
const allowedMatches = [];

for (const file of files) {
  const text = await readFile(resolve(repoRoot, file), "utf8");
  const lines = text.split(/\r?\n/);

  for (const rule of rules) {
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex];
      rule.pattern.lastIndex = 0;
      if (!rule.pattern.test(line)) {
        continue;
      }

      const context = contextFor(lines, lineIndex);
      const allowed = (rule.allowPath?.test(file) ?? false) || (rule.allowContext?.test(context) ?? false);
      const entry = {
        file,
        line: lineIndex + 1,
        rule: rule.id,
        severity: rule.severity,
        message: rule.message,
        text: line.trim()
      };

      if (allowed) {
        allowedMatches.push(entry);
      } else {
        findings.push(entry);
      }
    }
  }
}

const summary = {
  scannedFiles: files.length,
  errors: findings.filter((finding) => finding.severity === "error").length,
  warnings: findings.filter((finding) => finding.severity === "warning").length,
  allowedMatches: allowedMatches.length,
  findings
};

if (jsonOutput) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(
    `Privacy/security scan checked ${summary.scannedFiles} files: ${summary.errors} errors, ${summary.warnings} warnings, ${summary.allowedMatches} allowed guardrail mentions.`
  );
  for (const finding of findings) {
    console.log(`[${finding.severity}] ${finding.rule} ${finding.file}:${finding.line} - ${finding.text}`);
  }
}

if (summary.errors > 0 || (strict && summary.warnings > 0)) {
  process.exitCode = 1;
}

async function collectFiles() {
  const collected = [];

  for (const scanRoot of scanRoots) {
    const absolute = resolve(repoRoot, scanRoot);
    const rootStats = await stat(absolute).catch(() => undefined);
    if (!rootStats) {
      continue;
    }
    if (rootStats.isFile()) {
      addIfScannable(collected, scanRoot);
    } else {
      await walk(absolute, collected);
    }
  }

  return [...new Set(collected)].sort();
}

async function walk(directory, collected) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const absolute = join(directory, entry.name);
    const rel = normalizePath(relative(repoRoot, absolute));

    if (entry.isDirectory()) {
      if (["dist", "node_modules", "coverage", ".vite"].includes(entry.name)) {
        continue;
      }
      await walk(absolute, collected);
      continue;
    }

    addIfScannable(collected, rel);
  }
}

function addIfScannable(collected, relPath) {
  const normalized = normalizePath(relPath);
  if (excludedPathPatterns.some((pattern) => pattern.test(normalized))) {
    return;
  }
  if (![".js", ".jsx", ".mjs", ".ts", ".tsx", ".md"].includes(extname(normalized))) {
    return;
  }
  collected.push(normalized);
}

function contextFor(lines, lineIndex) {
  return lines.slice(Math.max(0, lineIndex - 1), Math.min(lines.length, lineIndex + 2)).join(" ");
}

function normalizePath(value) {
  return value.split("\\").join("/");
}
