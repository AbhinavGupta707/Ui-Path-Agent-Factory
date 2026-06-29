#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const folderKey = "cba41e19-47cc-4a0a-bf73-de88b60a61be";
const folderId = 7986306;
const projectPath = "uipath/maestro/customer360-build";
const bpmnPath = `${projectPath}/agent-factory-customer360-build.bpmn`;
const processName = "Governed Agentic Automation Factory - Customer360 Build";
const packageName = "AgentFactoryCustomer360Build";
const version = process.env.UIPATH_MAESTRO_PACKAGE_VERSION ?? "1.0.0";
const outputPath = process.env.UIPATH_MAESTRO_PACKAGE_OUTPUT ?? "/private/tmp/agent-factory-maestro-package";
const requestId = process.env.AGENT_FACTORY_REQUEST_ID ?? "REQ-2026-001";
const factoryApiBaseUrl = process.env.FACTORY_API_PUBLIC_URL ?? "https://<approved-factory-api-host>";
const buildWorkerBaseUrl = process.env.BUILD_WORKER_PUBLIC_URL ?? "https://<approved-build-worker-host>";
const deploymentUrl = process.env.CUSTOMER360_PUBLIC_URL ?? process.env.CUSTOMER360_DEPLOYMENT_URL ?? "https://<approved-preview-host>";
const approved = process.env.AGENT_FACTORY_APPROVE_UIPATH_LIVE === "true";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || process.argv.length <= 2) {
  printHelp();
  process.exit(0);
}

if (args.has("--plan")) {
  printPlan();
}

if (args.has("--check-readiness")) {
  runReadinessChecks();
}

if (args.has("--execute-publish")) {
  requireApproval("--execute-publish");
  runCommand(publishCommand());
}

if (args.has("--execute-run")) {
  requireApproval("--execute-run");
  const processKey = process.env.UIPATH_MAESTRO_PROCESS_KEY;
  const releaseKey = process.env.UIPATH_MAESTRO_RELEASE_KEY;

  if (!processKey || !releaseKey) {
    fail("Set UIPATH_MAESTRO_PROCESS_KEY and UIPATH_MAESTRO_RELEASE_KEY from the publish/list output before --execute-run.");
  }

  runCommand(runCommandArgs(processKey, releaseKey));
}

function printHelp() {
  console.log(`Usage:
  node scripts/uipath-live-spine.mjs --plan
  node scripts/uipath-live-spine.mjs --check-readiness
  AGENT_FACTORY_APPROVE_UIPATH_LIVE=true node scripts/uipath-live-spine.mjs --execute-publish
  AGENT_FACTORY_APPROVE_UIPATH_LIVE=true UIPATH_MAESTRO_PROCESS_KEY=<key:version> UIPATH_MAESTRO_RELEASE_KEY=<guid> node scripts/uipath-live-spine.mjs --execute-run

This helper never performs UiPath live mutations unless AGENT_FACTORY_APPROVE_UIPATH_LIVE=true and an explicit --execute-* flag is used.`);
}

function printPlan() {
  const runInputs = maestroRunInputs();
  const recordMaestroEvent = recordEventInput({
    event_type: "maestro_run_started",
    platformMode: "uipath-live",
    summary: "Maestro live run started for the Customer360 request.",
    maestro_process_key: "<process-key:version from publish/list>",
    maestro_job_key: "<jobKey from process run>",
    maestro_trace_id: "<traceId from process run>"
  });
  const recordHumanGateEvent = recordEventInput({
    event_type: "action_center_task_created",
    platformMode: "uipath-live",
    summary: "Live human approval task is visible for scope or release decision.",
    action_center_task_id: "<task id from Maestro/Action Center>",
    approval_type: "scope_data_approval"
  });

  console.log("Checkpoint 7 live UiPath spine plan");
  console.log("");
  console.log("Required public endpoints before live run:");
  console.log(`- FACTORY_API_PUBLIC_URL=${factoryApiBaseUrl}`);
  console.log(`- BUILD_WORKER_PUBLIC_URL=${buildWorkerBaseUrl}`);
  console.log(`- CUSTOMER360_PUBLIC_URL=${deploymentUrl}`);
  console.log("");
  console.log("Safe readiness checks:");
  printCommand(["npm", "run", "uipath:readiness"]);
  console.log("");
  console.log("Approval-gated publish command:");
  printCommand(publishCommand());
  console.log("");
  console.log("After publish, list processes and capture ProcessKey/ReleaseKey:");
  printCommand(["uip", "maestro", "bpmn", "process", "list", "--folder-key", folderKey, "--output", "json"]);
  console.log("");
  console.log("Approval-gated run command shape:");
  printCommand(runCommandArgs("<process-key:version>", "<release-key-guid>"));
  console.log("Run inputs:");
  console.log(JSON.stringify(runInputs, null, 2));
  console.log("");
  console.log("Record the returned Maestro job/trace evidence in the Factory API:");
  printCommand(recordEventWorkflowCommand(recordMaestroEvent));
  console.log("");
  console.log("When the live human gate appears, record the task id:");
  printCommand(["uip", "tasks", "list", "--output", "json"]);
  printCommand(recordEventWorkflowCommand(recordHumanGateEvent));
  console.log("");
  console.log("After API Workflow/Test Manager/Data Service live actions, use AgentFactory_RecordUiPathEvent with the matching id fields.");
}

function runReadinessChecks() {
  const commands = [
    ["uip", "login", "status", "--output", "json"],
    ["uip", "or", "folders", "get", "AgentFactoryDemo", "--output", "json"],
    ["uip", "tm", "project", "list", "--limit", "5", "--output", "json"],
    ["uip", "tm", "testcases", "list", "--project-key", "AFQG", "--output", "json"],
    ["uip", "maestro", "bpmn", "validate", bpmnPath, "--output", "json"],
    ["uip", "api-workflow", "validate", "uipath/api-workflows/AgentFactory_StartBuildWorker/Workflow.json", "--output", "json"],
    ["uip", "api-workflow", "validate", "uipath/api-workflows/AgentFactory_FetchBuildStatus/Workflow.json", "--output", "json"],
    ["uip", "api-workflow", "validate", "uipath/api-workflows/AgentFactory_PostStatusUpdate/Workflow.json", "--output", "json"],
    ["uip", "api-workflow", "validate", "uipath/api-workflows/AgentFactory_RecordTestResult/Workflow.json", "--output", "json"],
    ["uip", "api-workflow", "validate", "uipath/api-workflows/AgentFactory_StartDeployment/Workflow.json", "--output", "json"],
    ["uip", "api-workflow", "validate", "uipath/api-workflows/AgentFactory_RecordUiPathEvent/Workflow.json", "--output", "json"]
  ];

  for (const command of commands) {
    runCommand(command);
  }
}

function publishCommand() {
  return [
    "uip",
    "maestro",
    "bpmn",
    "process",
    "publish",
    projectPath,
    outputPath,
    "--folder-key",
    folderKey,
    "--name",
    packageName,
    "--process-name",
    processName,
    "--version",
    version,
    "--wait",
    "--output",
    "json"
  ];
}

function runCommandArgs(processKey, releaseKey) {
  return [
    "uip",
    "maestro",
    "bpmn",
    "process",
    "run",
    processKey,
    folderKey,
    "--release-key",
    releaseKey,
    "--inputs",
    JSON.stringify(maestroRunInputs()),
    "--output",
    "json"
  ];
}

function maestroRunInputs() {
  return {
    requestId,
    platformMode: "uipath-live",
    factoryApiBaseUrl,
    buildWorkerBaseUrl,
    deploymentServiceBaseUrl: factoryApiBaseUrl,
    deploymentUrl,
    folderKey,
    folderId
  };
}

function recordEventInput(event) {
  return {
    operationId: `uipath-live-${requestId.toLowerCase()}-${event.event_type}`,
    requestId,
    platformMode: "uipath-live",
    factoryApiBaseUrl,
    event
  };
}

function recordEventWorkflowCommand(input) {
  return [
    "uip",
    "api-workflow",
    "run",
    "uipath/api-workflows/AgentFactory_RecordUiPathEvent/Workflow.json",
    "--input-arguments",
    JSON.stringify(input),
    "--output",
    "json"
  ];
}

function runCommand(command) {
  printCommand(command);
  const result = spawnSync(command[0], command.slice(1), {
    stdio: "inherit",
    env: process.env
  });

  if (result.error) {
    fail(result.error.message);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function printCommand(command) {
  console.log(command.map(shellQuote).join(" "));
}

function shellQuote(value) {
  if (/^[A-Za-z0-9_./:@=-]+$/.test(value)) {
    return value;
  }

  return `'${value.replaceAll("'", "'\\''")}'`;
}

function requireApproval(flag) {
  if (!approved) {
    fail(`${flag} is blocked. Set AGENT_FACTORY_APPROVE_UIPATH_LIVE=true only after the exact command is approved.`);
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
