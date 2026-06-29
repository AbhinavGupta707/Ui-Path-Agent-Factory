#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const targets = {
  customer360: {
    label: "Customer360 dashboard",
    workspace: "@agent-factory/customer360-template",
    dist: "apps/customer360-template/dist",
    defaultLocalUrl: "http://localhost:5174"
  },
  "factory-console": {
    label: "Factory Console",
    workspace: "@agent-factory/factory-console",
    dist: "apps/factory-console/dist",
    defaultLocalUrl: "http://localhost:5173"
  }
};

const args = new Set(process.argv.slice(2));
const targetName = valueArg("target") ?? "customer360";
const target = targets[targetName];
const execute = args.has("--execute");
const vercelPreview = args.has("--vercel-preview");

if (!target) {
  fail(`Unknown target "${targetName}". Use customer360 or factory-console.`);
}

const deploymentServiceBaseUrl = process.env.DEPLOYMENT_SERVICE_BASE_URL ?? "http://localhost:8787";
const requestId = process.env.DEPLOYMENT_REQUEST_ID ?? "REQ-2026-001";
const buildRunId = process.env.DEPLOYMENT_BUILD_RUN_ID ?? "BUILD-REQ-2026-001-001";
const operationId = process.env.DEPLOYMENT_OPERATION_ID ?? `deploy_${requestId.toLowerCase().replaceAll("-", "_")}_001`;
const deploymentUrl = process.env.CUSTOMER360_DEPLOYMENT_URL ?? process.env.CUSTOMER360_TEMPLATE_URL ?? target.defaultLocalUrl;
const distPath = resolve(target.dist);

if (!execute) {
  console.log(`Sandbox deployment dry run for ${target.label}`);
  console.log("");
  console.log("Build command:");
  console.log(`npm --workspace ${target.workspace} run build`);
  console.log("");
  console.log(vercelPreview ? "Preview deploy command:" : "Local sandbox command:");
  console.log(vercelPreview ? `vercel deploy ${target.dist} --yes` : `npm --workspace ${target.workspace} run dev`);
  console.log("");
  console.log("Factory API deployment evidence command:");
  console.log(deployEvidenceCommand(deploymentServiceBaseUrl, operationId, requestId, buildRunId, deploymentUrl));
  console.log("");
  console.log("Add --execute to run the build. Add --vercel-preview with AGENT_FACTORY_ALLOW_VERCEL_PREVIEW=true to deploy a preview.");
  process.exit(0);
}

await run("npm", ["--workspace", target.workspace, "run", "build"]);

if (!vercelPreview) {
  console.log(`Built ${target.label}. Start the sandbox app with:`);
  console.log(`npm --workspace ${target.workspace} run dev`);
  console.log("");
  console.log("Then record deployment evidence with:");
  console.log(deployEvidenceCommand(deploymentServiceBaseUrl, operationId, requestId, buildRunId, deploymentUrl));
  process.exit(0);
}

if (process.env.AGENT_FACTORY_ALLOW_VERCEL_PREVIEW !== "true") {
  fail("Set AGENT_FACTORY_ALLOW_VERCEL_PREVIEW=true before executing a Vercel preview deployment.");
}

if (!existsSync(distPath)) {
  fail(`Expected build output is missing: ${target.dist}`);
}

console.log("Deploying preview build to Vercel. Production deploy is not used.");
await run("vercel", ["deploy", target.dist, "--yes"]);
console.log("");
console.log("After Vercel prints the preview URL, record evidence with:");
console.log(deployEvidenceCommand(deploymentServiceBaseUrl, operationId, requestId, buildRunId, "https://<vercel-preview-url>"));

function valueArg(name) {
  const prefix = `--${name}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

function deployEvidenceCommand(baseUrl, idempotencyKey, request, build, url) {
  const body = JSON.stringify({
    requestId: request,
    platformMode: "uipath-ready",
    buildRunId: build,
    environment: "sandbox",
    deploymentUrl: url,
    deploymentProvider: url.includes("vercel.app") ? "vercel-preview" : "local-sandbox",
    releaseApproval: {
      status: "approved",
      approvalId: `appr_${request.toLowerCase().replaceAll("-", "_")}_release_001`,
      decidedBy: "release-approver"
    }
  });

  return `curl -X POST ${baseUrl}/deploy -H "content-type: application/json" -H "x-agent-factory-operation-id: ${idempotencyKey}" -d '${body}'`;
}

function run(command, commandArgs) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, commandArgs, {
      cwd: process.cwd(),
      stdio: "inherit"
    });

    child.on("error", rejectRun);
    child.on("exit", (code) => {
      if (code === 0) {
        resolveRun();
        return;
      }

      rejectRun(new Error(`${command} ${commandArgs.join(" ")} exited with ${code}`));
    });
  });
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
