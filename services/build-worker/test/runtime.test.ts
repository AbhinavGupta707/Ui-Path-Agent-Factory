import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createBuildWorkerRequestHandler,
  createBuildWorkerRuntime,
  type BuildRunnerFunction
} from "../src/index.js";

const safeManifestPayload = {
  operationId: "build_req_runtime_001",
  requestId: "REQ-2026-101",
  platformMode: "local-simulated",
  manifest: {
    template_id: "customer360_dashboard_v1",
    sandbox_only: true,
    pii_policy: "mask_email_name_phone",
    allowed_files_json: ["src/**", "tests/**", "public/data/**", "README.md"]
  }
};

afterEach(() => {
  delete process.env.AGENT_FACTORY_BRIDGE_TOKEN;
});

describe("build worker runtime", () => {
  it("queues, executes, and records lifecycle events through an injected runner", async () => {
    const runner: BuildRunnerFunction = async (input, context) => {
      await context.updateStatus("tests_running", "Metric and PII checks started.");

      return {
        status: "awaiting_release_approval",
        codexSessionId: "codex-session-001",
        logsUri: path.join(input.workspace.logsRoot, "codex.jsonl"),
        branchName: "codex/req-2026-101",
        commitSha: "abc1234",
        generatedFiles: ["src/App.tsx", "tests/metrics.test.ts"],
        checks: [
          {
            name: "metric-tests",
            status: "passed",
            summary: "Metric tests passed."
          }
        ],
        artifacts: [
          {
            name: "workspace",
            type: "workspace",
            path: input.workspace.workspaceRoot
          }
        ]
      };
    };
    const runtime = createBuildWorkerRuntime({
      workerId: "worker-test",
      workspaceRoot: path.join(tmpdir(), "agent-factory-build-worker-tests"),
      runner
    });

    const result = await runtime.queueBuild(safeManifestPayload, { waitForCompletion: true });

    expect(result.duplicate).toBe(false);
    expect(result.run.status).toBe("awaiting_release_approval");
    expect(result.run.codex_session_id).toBe("codex-session-001");
    expect(result.run.generated_files_json).toEqual(["src/App.tsx", "tests/metrics.test.ts"]);
    expect(result.run.workspace.workspaceRoot).toContain("agent-factory-build-worker-tests");
    expect(result.run.events.map((event) => event.action)).toEqual([
      "build_queued",
      "build_started",
      "runner_status_updated",
      "tests_recorded",
      "artifact_capture",
      "build_finished"
    ]);
  });

  it("keeps operation ids idempotent", async () => {
    const runtime = createBuildWorkerRuntime({
      workspaceRoot: path.join(tmpdir(), "agent-factory-build-worker-idempotency"),
      runner: async () => ({ status: "awaiting_release_approval" })
    });

    const first = await runtime.queueBuild(safeManifestPayload, { start: false });
    const second = await runtime.queueBuild(safeManifestPayload, { start: false });

    expect(second.duplicate).toBe(true);
    expect(second.run.build_run_id).toBe(first.run.build_run_id);
  });
});

describe("build worker HTTP handler", () => {
  it("serves health, queues builds, and returns build status", async () => {
    const runtime = createBuildWorkerRuntime({
      workspaceRoot: path.join(tmpdir(), "agent-factory-build-worker-http"),
      runner: async () => ({
        status: "awaiting_release_approval",
        generatedFiles: ["README.md"]
      })
    });
    const handler = createBuildWorkerRequestHandler(runtime);

    const health = await handler({ method: "GET", pathname: "/health" });
    expect(health.statusCode).toBe(200);
    expect(readField(health.body, "service")).toBe("build-worker");
    expect(readField(health.body, "runnerConfiguration")).toEqual(
      expect.objectContaining({
        mode: "injected",
        workspaceMode: "isolated-workspace"
      })
    );

    const queued = await handler({
      method: "POST",
      pathname: "/build",
      body: {
        ...safeManifestPayload,
        operationId: "build_req_http_001",
        requestId: "REQ-2026-102"
      }
    });
    expect(queued.statusCode).toBe(202);

    const buildRunId = readField(queued.body, "build_run_id");
    expect(typeof buildRunId).toBe("string");
    await new Promise((resolve) => setTimeout(resolve, 0));

    const fetched = await handler({ method: "GET", pathname: `/build/${buildRunId}` });
    expect(fetched.statusCode).toBe(200);
    const data = readField(fetched.body, "data");

    expect(readField(data, "status")).toBe("awaiting_release_approval");
    expect(readField(data, "generatedFiles")).toEqual(["README.md"]);
    expect(readField(readField(data, "evidence"), "generatedFiles")).toEqual(["README.md"]);
    expect(readField(readField(data, "evidence"), "failureReason")).toBeUndefined();
  });

  it("requires bridge token for build routes only when configured", async () => {
    process.env.AGENT_FACTORY_BRIDGE_TOKEN = "bridge-secret";
    const runtime = createBuildWorkerRuntime({
      workspaceRoot: path.join(tmpdir(), "agent-factory-build-worker-bridge-token"),
      runner: async () => ({
        status: "awaiting_release_approval"
      })
    });
    const handler = createBuildWorkerRequestHandler(runtime);

    const health = await handler({ method: "GET", pathname: "/health" });
    expect(health.statusCode).toBe(200);

    const rejected = await handler({
      method: "POST",
      pathname: "/build",
      body: safeManifestPayload
    });
    expect(rejected.statusCode).toBe(401);
    expect(readField(rejected.body, "error")).toBe("bridge_token_required");

    const accepted = await handler({
      method: "POST",
      pathname: "/build",
      headers: {
        "x-agent-factory-bridge-token": "bridge-secret"
      },
      body: safeManifestPayload
    });
    expect(accepted.statusCode).toBe(202);
  });

  it("reports safe degraded runner configuration from the default runtime", async () => {
    const runtime = createBuildWorkerRuntime({
      workspaceRoot: path.join(tmpdir(), "agent-factory-build-worker-default")
    });
    const health = await runtime.health();

    expect(health.runnerConfigured).toBe(false);
    expect(health.runnerConfiguration).toEqual(
      expect.objectContaining({
        mode: "disabled",
        codexEnabled: false,
        workspaceMode: "isolated-workspace"
      })
    );
  });
});

function readField(value: unknown, field: string): unknown {
  expect(value).toBeTypeOf("object");
  expect(value).not.toBeNull();
  return (value as Record<string, unknown>)[field];
}
