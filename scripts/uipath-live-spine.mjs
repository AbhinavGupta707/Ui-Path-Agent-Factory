#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const folderName = process.env.UIPATH_FOLDER_NAME ?? "AgentFactoryDemoLiveSpine 1";
const folderKey = process.env.UIPATH_FOLDER_KEY ?? "d991e64c-d0ad-4ec6-9798-8783b166a073";
const folderId = Number(process.env.UIPATH_FOLDER_ID ?? 7989142);
const projectPath = "uipath/maestro/customer360-build";
const bpmnPath = `${projectPath}/agent-factory-customer360-build.bpmn`;
const processName = "Governed Agentic Automation Factory - Customer360 Build";
const packageName = "AgentFactoryCustomer360Build";
const version = process.env.UIPATH_MAESTRO_PACKAGE_VERSION ?? "1.0.1";
const outputPath = process.env.UIPATH_MAESTRO_PACKAGE_OUTPUT ?? "/private/tmp/agent-factory-maestro-package";
const solutionName = process.env.UIPATH_SOLUTION_NAME ?? "AgentFactoryMaestroSolutionBridgeSpine";
const solutionVersion = process.env.UIPATH_SOLUTION_VERSION ?? "1.0.1";
const solutionVersionSuffix = solutionVersion.replaceAll(".", "");
const solutionWorkspace = process.env.UIPATH_SOLUTION_WORKSPACE ?? `/private/tmp/${solutionName}${solutionVersionSuffix}`;
const solutionWorkspaceName = solutionWorkspace.split("/").filter(Boolean).at(-1) ?? solutionName;
const solutionFile = process.env.UIPATH_SOLUTION_FILE ?? `${solutionWorkspace}/${solutionWorkspaceName}.uipx`;
const solutionPackageDir =
  process.env.UIPATH_SOLUTION_PACKAGE_DIR ?? `/private/tmp/agent-factory-solution-packages-${solutionVersionSuffix}`;
const deployedPackageProcessKey =
  process.env.UIPATH_MAESTRO_PROCESS_KEY ?? "AgentFactoryMaestroSolutionBridgeSpine.Agentic.customer360-build:1.0.1";
const deployedReleaseKey =
  process.env.UIPATH_MAESTRO_RELEASE_KEY ?? "70d07489-d32a-4f56-9f5e-5fadaf8b14e6";
const deployedFeedId = process.env.UIPATH_MAESTRO_FEED_ID ?? "e4c3d330-c071-4dc1-9bb9-9a18c65dfd83";
const requestId = process.env.AGENT_FACTORY_REQUEST_ID ?? "REQ-2026-001";
const factoryApiBaseUrl = process.env.FACTORY_API_PUBLIC_URL ?? "https://<approved-factory-api-host>";
const buildWorkerBaseUrl = process.env.BUILD_WORKER_PUBLIC_URL ?? "https://<approved-build-worker-host>";
const deploymentUrl = process.env.CUSTOMER360_PUBLIC_URL ?? process.env.CUSTOMER360_DEPLOYMENT_URL ?? "https://<approved-preview-host>";
const bridgeToken = process.env.AGENT_FACTORY_BRIDGE_TOKEN ?? process.env.AGENT_FACTORY_BRIDGE_TOKEN_INPUT ?? "<approved-bridge-token>";
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
  requireBridgeTokenForExecution();
  runCommand(runCommandArgs(deployedPackageProcessKey, deployedReleaseKey));
}

function printHelp() {
  console.log(`Usage:
  node scripts/uipath-live-spine.mjs --plan
  node scripts/uipath-live-spine.mjs --check-readiness
  AGENT_FACTORY_APPROVE_UIPATH_LIVE=true node scripts/uipath-live-spine.mjs --execute-publish
  AGENT_FACTORY_APPROVE_UIPATH_LIVE=true AGENT_FACTORY_BRIDGE_TOKEN=<token> node scripts/uipath-live-spine.mjs --execute-run

This helper never performs UiPath live mutations unless AGENT_FACTORY_APPROVE_UIPATH_LIVE=true and an explicit --execute-* flag is used.
Defaults point at the current isolated AgentFactoryDemoLiveSpine 1 solution folder. Override UIPATH_FOLDER_KEY, UIPATH_MAESTRO_PROCESS_KEY, UIPATH_MAESTRO_RELEASE_KEY, and UIPATH_MAESTRO_FEED_ID only when intentionally targeting another Agent Factory folder.`);
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
  console.log("Isolated UiPath target:");
  console.log(`- UIPATH_FOLDER_NAME=${folderName}`);
  console.log(`- UIPATH_FOLDER_KEY=${folderKey}`);
  console.log(`- UIPATH_FOLDER_ID=${folderId}`);
  console.log(`- UIPATH_MAESTRO_PROCESS_KEY=${deployedPackageProcessKey}`);
  console.log(`- UIPATH_MAESTRO_RELEASE_KEY=${deployedReleaseKey}`);
  console.log(`- UIPATH_MAESTRO_FEED_ID=${deployedFeedId}`);
  console.log("");
  console.log("Required public endpoints before live run:");
  console.log(`- FACTORY_API_PUBLIC_URL=${factoryApiBaseUrl}`);
  console.log(`- BUILD_WORKER_PUBLIC_URL=${buildWorkerBaseUrl}`);
  console.log(`- CUSTOMER360_PUBLIC_URL=${deploymentUrl}`);
  console.log(`- AGENT_FACTORY_BRIDGE_TOKEN=${bridgeTokenForDisplay()}`);
  console.log("");
  console.log("Safe readiness checks:");
  printCommand(["npm", "run", "uipath:readiness"]);
  console.log("");
  console.log("Preferred solution lifecycle commands used for the live process deployment:");
  for (const command of solutionLifecycleCommands()) {
    printCommand(command);
  }
  console.log("");
  console.log("Legacy direct publish command shape, retained for future CLI/platform fixes:");
  printCommand(publishCommand());
  console.log("Current evidence shows this direct command fails on CLI 1.195.1 with HTTP 400: Invalid argument 'Period'.");
  console.log("");
  console.log("List solution-deployed process/release evidence:");
  printCommand(["uip", "maestro", "bpmn", "process", "list", "--folder-key", folderKey, "--output", "json"]);
  console.log("");
  console.log("Approval-gated run command shape:");
  printCommand(runCommandArgs(deployedPackageProcessKey, deployedReleaseKey));
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
    ["uip", "or", "folders", "get", folderName, "--output", "json"],
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

function solutionLifecycleCommands() {
  return [
    ["uip", "solution", "init", solutionWorkspace, "--output", "json"],
    [
      "uip",
      "solution",
      "project",
      "import",
      "--source",
      projectPath,
      "--solutionFile",
      solutionFile,
      "--output",
      "json"
    ],
    [
      "uip",
      "solution",
      "pack",
      solutionWorkspace,
      solutionPackageDir,
      "--name",
      solutionName,
      "--version",
      solutionVersion,
      "--output",
      "json"
    ],
    [
      "uip",
      "solution",
      "publish",
      `${solutionPackageDir}/${solutionName}_${solutionVersion}.zip`,
      "--wait",
      "--output",
      "json"
    ],
    [
      "uip",
      "solution",
      "deploy",
      "run",
      "--name",
      `${solutionName}Deployment${solutionVersionSuffix}`,
      "--package-name",
      solutionName,
      "--package-version",
      solutionVersion,
      "--folder-name",
      folderName,
      "--output",
      "json"
    ]
  ];
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
  const command = [
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
    JSON.stringify(maestroRunInputs())
  ];

  if (deployedFeedId) {
    command.push("--feed-id", deployedFeedId);
  }

  command.push("--output", "json");

  return command;
}

function maestroRunInputs() {
  return {
    requestId,
    platformMode: "uipath-live",
    factoryApiBaseUrl,
    buildWorkerBaseUrl,
    deploymentServiceBaseUrl: factoryApiBaseUrl,
    deploymentUrl,
    bridgeToken,
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
    bridgeToken,
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

function requireBridgeTokenForExecution() {
  if (bridgeToken === "<approved-bridge-token>") {
    fail("Set AGENT_FACTORY_BRIDGE_TOKEN or AGENT_FACTORY_BRIDGE_TOKEN_INPUT before --execute-run.");
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function bridgeTokenForDisplay() {
  return process.env.AGENT_FACTORY_BRIDGE_TOKEN ? "<redacted-from-env>" : bridgeToken;
}
