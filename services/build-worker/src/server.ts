import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { pathToFileURL } from "node:url";
import { ManifestValidationError } from "./manifest.js";
import { createBuildWorkerRuntime, type BuildWorkerRuntime } from "./runtime.js";
import type { BuildWorkerRun } from "./store.js";

export interface BuildWorkerRequestInput {
  method: string;
  pathname: string;
  headers?: Record<string, string | undefined>;
  body?: unknown;
}

export interface BuildWorkerResponseOutput {
  statusCode: number;
  body: unknown;
}

export class BuildWorkerHttpError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "BuildWorkerHttpError";
  }
}

const defaultHandler = createBuildWorkerRequestHandler();

export function createBuildWorkerServer(runtime: BuildWorkerRuntime = createBuildWorkerRuntime()) {
  const handler = createBuildWorkerRequestHandler(runtime);

  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://localhost");
      const method = request.method ?? "GET";
      const body = method === "POST" || method === "PATCH" ? await readJson(request) : undefined;
      const result = await handler({
        method,
        pathname: url.pathname,
        headers: normalizeHeaders(request.headers),
        body
      });

      writeJson(response, result.statusCode, result.body);
    } catch (error) {
      const result = errorResponse(error);
      writeJson(response, result.statusCode, result.body);
    }
  });
}

export function createBuildWorkerRequestHandler(runtime: BuildWorkerRuntime = createBuildWorkerRuntime()) {
  return async function handleBuildWorkerRequestWithRuntime(
    input: BuildWorkerRequestInput
  ): Promise<BuildWorkerResponseOutput> {
    try {
      return await routeBuildWorkerRequest(runtime, input);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export async function handleBuildWorkerRequest(input: BuildWorkerRequestInput): Promise<BuildWorkerResponseOutput> {
  return defaultHandler(input);
}

async function routeBuildWorkerRequest(
  runtime: BuildWorkerRuntime,
  input: BuildWorkerRequestInput
): Promise<BuildWorkerResponseOutput> {
  const method = input.method.toUpperCase();
  const parts = input.pathname.split("/").filter(Boolean);

  if (method === "OPTIONS") {
    return { statusCode: 204, body: {} };
  }

  if (method === "GET" && input.pathname === "/health") {
    return {
      statusCode: 200,
      body: await runtime.health()
    };
  }

  if (method === "POST" && input.pathname === "/build") {
    requireBridgeToken(input.headers);
    const result = await runtime.queueBuild(input.body ?? {});
    const run = result.run;

    return {
      statusCode: result.duplicate ? 200 : 202,
      body: {
        build_run_id: run.build_run_id,
        buildRunId: run.build_run_id,
        request_id: run.request_id,
        requestId: run.request_id,
        status: run.status,
        acceptedAt: run.accepted_at,
        duplicate: result.duplicate,
        platformMode: run.platformMode,
        data: serializeRun(run)
      }
    };
  }

  if (method === "GET" && parts.length === 2 && parts[0] === "build") {
    requireBridgeToken(input.headers);
    const run = await runtime.getRun(parts[1] ?? "");

    if (!run) {
      throw new BuildWorkerHttpError(404, "build_not_found", `Build run not found: ${parts[1] ?? ""}`);
    }

    return {
      statusCode: 200,
      body: {
        data: serializeRun(run),
        platformMode: run.platformMode
      }
    };
  }

  throw new BuildWorkerHttpError(404, "not_found", `No route for ${method} ${input.pathname}.`);
}

function serializeRun(run: BuildWorkerRun) {
  return {
    ...run,
    buildRunId: run.build_run_id,
    requestId: run.request_id,
    manifestId: run.manifest_id,
    operationId: run.operation_id,
    workerId: run.worker_id,
    branchName: run.branch_name,
    commitSha: run.commit_sha,
    prUrl: run.pr_url,
    codexSessionId: run.codex_session_id,
    logsUri: run.logs_uri,
    generatedFiles: run.generated_files_json,
    failureReason: run.failure_reason,
    acceptedAt: run.accepted_at,
    startedAt: run.started_at,
    completedAt: run.completed_at,
    updatedAt: run.updated_at,
    evidence: summarizeRunEvidence(run)
  };
}

function summarizeRunEvidence(run: BuildWorkerRun) {
  const runnerConfiguration = findEventPayload(run, "runner_configuration_checked", "runner");
  const workspace = findEventPayload(run, "codex_workspace_inputs_written", "workspace");
  const guardrails =
    findEventPayload(run, "codex_workspace_inputs_written", "guardrails") ??
    findEventPayload(run, "codex_build_completed", "guardrails");
  const readiness = findEventPayload(run, "codex_readiness_checked", "codex");
  const build = findEventPayload(run, "codex_build_completed", "codex");

  return {
    status: run.status,
    blockedReason: run.status === "blocked" ? run.failure_reason : undefined,
    failureReason: run.failure_reason,
    branchName: run.branch_name,
    commitSha: run.commit_sha,
    prUrl: run.pr_url,
    codexSessionId: run.codex_session_id,
    logsUri: run.logs_uri,
    codex: {
      enabled: readBoolean(runnerConfiguration, "codexEnabled"),
      ready: readiness ? readBoolean(readiness, "succeeded") : undefined,
      authStatus: readString(readiness, "authStatus"),
      executable: readString(runnerConfiguration, "executable") ?? readString(readiness, "executable"),
      model: readString(runnerConfiguration, "model") ?? readString(readiness, "model") ?? readString(build, "model"),
      readinessSandbox: readString(runnerConfiguration, "readinessSandbox") ?? readString(readiness, "sandbox"),
      buildSandbox: readString(runnerConfiguration, "buildSandbox") ?? readString(build, "sandbox"),
      jsonlCapture: readBoolean(runnerConfiguration, "jsonlCapture") ?? readBoolean(build, "jsonlCapture"),
      sessionId: run.codex_session_id,
      logsUri: run.logs_uri
    },
    workspace,
    guardrails,
    generatedFiles: run.generated_files_json,
    checks: run.checks.map((check) => ({
      name: check.name,
      status: check.status,
      summary: check.summary,
      reportUri: check.report_uri
    })),
    artifacts: run.artifacts.map((artifact) => ({
      name: artifact.name,
      type: artifact.type,
      path: artifact.path,
      uri: artifact.uri,
      summary: artifact.summary
    })),
    latestEvent: run.events.at(-1)
  };
}

function findEventPayload(run: BuildWorkerRun, action: string, field: string): Record<string, unknown> | undefined {
  for (const event of [...run.events].reverse()) {
    if (event.action !== action) {
      continue;
    }

    const value = event.payload_json?.[field];
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  }

  return undefined;
}

function readString(value: Record<string, unknown> | undefined, field: string): string | undefined {
  const candidate = value?.[field];
  return typeof candidate === "string" && candidate.trim().length > 0 ? candidate : undefined;
}

function readBoolean(value: Record<string, unknown> | undefined, field: string): boolean | undefined {
  const candidate = value?.[field];
  return typeof candidate === "boolean" ? candidate : undefined;
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new BuildWorkerHttpError(400, "invalid_json", "Request body must be valid JSON.");
  }
}

function writeJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,x-agent-factory-operation-id,x-agent-factory-bridge-token",
    "content-type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(body));
}

function requireBridgeToken(headers: Record<string, string | undefined> | undefined): void {
  const expected = process.env.AGENT_FACTORY_BRIDGE_TOKEN;

  if (!expected) {
    return;
  }

  if (headers?.["x-agent-factory-bridge-token"] !== expected) {
    throw new BuildWorkerHttpError(401, "bridge_token_required", "A valid bridge token is required.");
  }
}

function normalizeHeaders(headers: IncomingMessage["headers"]): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [
      name.toLowerCase(),
      Array.isArray(value) ? value.join(",") : value
    ])
  );
}

function errorResponse(error: unknown): BuildWorkerResponseOutput {
  if (error instanceof ManifestValidationError) {
    return {
      statusCode: 400,
      body: {
        error: "build_rejected",
        message: "Build manifest failed validation.",
        details: error.issues
      }
    };
  }

  if (error instanceof BuildWorkerHttpError) {
    return {
      statusCode: error.statusCode,
      body: {
        error: error.code,
        message: error.message
      }
    };
  }

  return {
    statusCode: 500,
    body: {
      error: "internal_error",
      message: error instanceof Error ? error.message : "Unknown build worker error."
    }
  };
}

function isDirectExecution(): boolean {
  return Boolean(process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href);
}

if (isDirectExecution()) {
  const port = Number(process.env.BUILD_WORKER_PORT ?? 8790);
  createBuildWorkerServer().listen(port, () => {
    console.log(`Build worker listening on http://localhost:${port}`);
  });
}
