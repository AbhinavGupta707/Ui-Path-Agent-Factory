import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  createBuildWorkerRuntime,
  createCodexGitBuildRunner,
  type CodexCommand,
  type CodexCommandExecutor,
  type CodexCommandRunOptions,
  type CodexCommandRawResult,
  type GitCommandRunner
} from "../src/index.js";

const manifestPayload = {
  requestId: "REQ-2026-CODEX",
  platformMode: "uipath-ready",
  manifest: {
    request_id: "REQ-2026-CODEX",
    manifest_id: "MAN-REQ-2026-CODEX",
    template_id: "customer360_dashboard_v1",
    artifact_type: "dashboard_app",
    sandbox_only: true,
    pii_policy: "mask_email_name_phone",
    branch_name: "codex/req-2026-codex",
    output_app: "apps/generated-customer360-template",
    allowed_files_json: ["src/**", "tests/**", "public/data/**", "README.md", "deployment.json", "package.json"],
    approved_data_sources_json: ["synthetic_customers_csv"],
    approved_metrics_json: ["revenue"],
    required_filters_json: ["date_range"],
    forbidden_actions_json: ["secret_access", "log_raw_pii"],
    output_targets_json: ["dashboard_app", "metric_tests", "readme"],
    max_repair_attempts: 1,
    created_at: "2026-06-29T00:00:00.000Z"
  }
};

describe("Codex live runner integration seam", () => {
  it("returns an honest blocked run when live Codex execution is disabled", async () => {
    const runtime = createBuildWorkerRuntime({
      workspaceRoot: path.join(tmpdir(), "agent-factory-codex-disabled"),
      runner: createCodexGitBuildRunner({ enabled: false })
    });

    const queued = await runtime.queueBuild(manifestPayload, { waitForCompletion: true });

    expect(queued.run.status).toBe("blocked");
    expect(queued.run.failure_reason).toContain("BUILD_WORKER_CODEX_ENABLED=true");
    expect(queued.run.checks).toEqual([
      expect.objectContaining({
        name: "codex-runner-configuration",
        status: "skipped"
      })
    ]);
    expect(queued.run.events.map((event) => event.action)).toContain("runner_configuration_checked");
  });

  it("runs Codex through an injected executor and returns local diff evidence without GitHub", async () => {
    const executor = createWritingCodexExecutor(async (cwd) => {
      await mkdir(path.join(cwd, "src"), { recursive: true });
      await mkdir(path.join(cwd, "tests"), { recursive: true });
      await writeFile(path.join(cwd, "src", "App.tsx"), "export const App = () => null;\n", "utf8");
      await writeFile(path.join(cwd, "tests", "metrics.test.ts"), "export const ok = true;\n", "utf8");
      await writeFile(path.join(cwd, "README.md"), "# Customer360\n", "utf8");
    });
    const runtime = createBuildWorkerRuntime({
      workspaceRoot: path.join(tmpdir(), "agent-factory-codex-live"),
      runner: createCodexGitBuildRunner({
        enabled: true,
        executor,
        gitRunner: createFakeGitRunner(),
        maxOutputBytes: 4_000
      })
    });

    const queued = await runtime.queueBuild(manifestPayload, { waitForCompletion: true });

    expect(queued.run.status).toBe("awaiting_release_approval");
    expect(queued.run.codex_session_id).toBe("codex-session-test");
    expect(queued.run.pr_url).toBeUndefined();
    expect(queued.run.branch_name).toBe("codex/req-2026-codex");
    expect(queued.run.generated_files_json).toEqual(["README.md", "src/App.tsx", "tests/metrics.test.ts"]);
    expect(queued.run.checks.map((check) => [check.name, check.status])).toEqual([
      ["codex-readiness", "passed"],
      ["codex-build", "passed"],
      ["manifest-allowlist", "passed"]
    ]);
    expect(queued.run.artifacts.map((artifact) => artifact.name)).toContain("local-diff");
  });

  it("blocks if Codex writes outside the manifest allowlist", async () => {
    const executor = createWritingCodexExecutor(async (cwd) => {
      await mkdir(path.join(cwd, "src"), { recursive: true });
      await mkdir(path.join(cwd, "dist"), { recursive: true });
      await writeFile(path.join(cwd, "src", "App.tsx"), "export const App = () => null;\n", "utf8");
      await writeFile(path.join(cwd, "dist", "leak.js"), "export const bad = true;\n", "utf8");
    });
    const runtime = createBuildWorkerRuntime({
      workspaceRoot: path.join(tmpdir(), "agent-factory-codex-forbidden"),
      runner: createCodexGitBuildRunner({
        enabled: true,
        executor,
        gitRunner: createFakeGitRunner()
      })
    });

    const queued = await runtime.queueBuild(
      {
        ...manifestPayload,
        operationId: "forbidden-file-run",
        requestId: "REQ-2026-CODEX-FORBIDDEN",
        manifest: {
          ...manifestPayload.manifest,
          request_id: "REQ-2026-CODEX-FORBIDDEN",
          manifest_id: "MAN-REQ-2026-CODEX-FORBIDDEN"
        }
      },
      { waitForCompletion: true }
    );

    expect(queued.run.status).toBe("blocked");
    expect(queued.run.failure_reason).toContain("outside the manifest allowlist");
    expect(queued.run.failure_reason).toContain("dist/leak.js");
    expect(queued.run.generated_files_json).toEqual(["src/App.tsx"]);
    expect(queued.run.checks).toContainEqual(
      expect.objectContaining({
        name: "manifest-allowlist",
        status: "failed"
      })
    );
  });
});

function createWritingCodexExecutor(writeWorkspaceFiles: (cwd: string) => Promise<void>): CodexCommandExecutor {
  return {
    async run(command: CodexCommand, options: CodexCommandRunOptions): Promise<CodexCommandRawResult> {
      const isReadiness = command.sandbox === "read-only";

      if (!isReadiness) {
        await writeWorkspaceFiles(options.cwd);
      }

      return {
        exitCode: 0,
        signal: null,
        durationMs: isReadiness ? 12 : 34,
        stdout: JSON.stringify({
          session_id: "codex-session-test",
          message: isReadiness ? "Codex ready." : "Codex build completed."
        }),
        stderr: "",
        timedOut: false
      };
    }
  };
}

function createFakeGitRunner(): GitCommandRunner {
  return {
    async run(args) {
      if (args.join(" ") === "rev-parse --abbrev-ref HEAD") {
        return { stdout: "", stderr: "not a git repository", exitCode: 1 };
      }

      if (args.join(" ") === "rev-parse HEAD") {
        return { stdout: "", stderr: "not a git repository", exitCode: 1 };
      }

      if (args.join(" ") === "status --porcelain=v1") {
        return {
          stdout: "?? README.md\n?? src/App.tsx\n?? tests/metrics.test.ts\n",
          stderr: "",
          exitCode: 0
        };
      }

      if (args.join(" ") === "diff HEAD --numstat --") {
        return {
          stdout: "1\t0\tREADME.md\n1\t0\tsrc/App.tsx\n1\t0\ttests/metrics.test.ts\n",
          stderr: "",
          exitCode: 0
        };
      }

      return { stdout: "", stderr: "", exitCode: 1 };
    }
  };
}
