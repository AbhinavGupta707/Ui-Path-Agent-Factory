import { normalizeBuildManifestPayload, type NormalizedBuildRequest } from "./manifest.js";
import {
  createCodexGitBuildRunner,
  type CodexLiveRunnerConfiguration
} from "./codex/live-runner.js";
import { redactSensitiveText } from "./codex/redaction.js";
import {
  createInMemoryBuildRunStore,
  type BuildArtifact,
  type BuildCheckResult,
  type BuildRunPatch,
  type BuildRunStore,
  type BuildWorkerRun,
  type BuildWorkerRunStatus
} from "./store.js";
import { createWorkspacePlan, prepareWorkspacePlan, type WorkspacePlan } from "./workspace.js";

export interface BuildRunnerInput {
  request: NormalizedBuildRequest;
  run: BuildWorkerRun;
  workspace: WorkspacePlan;
}

export interface BuildRunnerContext {
  updateStatus(
    status: BuildWorkerRunStatus,
    summary: string,
    patch?: Omit<BuildRunPatch, "status">
  ): Promise<BuildWorkerRun>;
  recordEvent(action: string, summary: string, payload_json?: Record<string, unknown>): Promise<BuildWorkerRun>;
}

export interface BuildRunnerResult {
  status?: Extract<BuildWorkerRunStatus, "awaiting_release_approval" | "build_failed" | "tests_failed" | "blocked" | "cancelled">;
  codexSessionId?: string;
  logsUri?: string;
  branchName?: string;
  commitSha?: string;
  prUrl?: string;
  generatedFiles?: string[];
  checks?: BuildCheckResult[];
  artifacts?: BuildArtifact[];
  failureReason?: string;
}

export interface BuildRunner {
  execute(input: BuildRunnerInput, context: BuildRunnerContext): Promise<BuildRunnerResult>;
  describeConfiguration?(): BuildRunnerConfiguration;
}

export type BuildRunnerConfiguration =
  | CodexLiveRunnerConfiguration
  | {
      mode: "injected" | "unconfigured";
      codexEnabled: boolean;
      githubConfigured: boolean;
      workspaceMode: "isolated-workspace";
      issues: string[];
    };

export type BuildRunnerFunction = (
  input: BuildRunnerInput,
  context: BuildRunnerContext
) => Promise<BuildRunnerResult>;

export interface BuildWorkerRuntimeOptions {
  store?: BuildRunStore;
  runner?: BuildRunner | BuildRunnerFunction;
  workspaceRoot?: string;
  workerId?: string;
}

export interface QueueBuildOptions {
  start?: boolean;
  waitForCompletion?: boolean;
}

export interface QueueBuildResult {
  run: BuildWorkerRun;
  duplicate: boolean;
}

export class BuildWorkerRuntime {
  private readonly runner: BuildRunner;
  private readonly store: BuildRunStore;
  private readonly workspaceRoot?: string;
  private readonly workerId: string;

  constructor(options: BuildWorkerRuntimeOptions = {}) {
    this.store = options.store ?? createInMemoryBuildRunStore();
    this.runner = normalizeRunner(options.runner);
    this.workspaceRoot = options.workspaceRoot;
    this.workerId = options.workerId ?? "build-worker-core";
  }

  async health() {
    const runnerConfiguration = describeRunnerConfiguration(this.runner);

    return {
      ok: true,
      service: "build-worker",
      platformMode: "uipath-ready" as const,
      workerId: this.workerId,
      runs: (await this.store.listRuns()).length,
      runnerConfigured: runnerConfiguration.codexEnabled || runnerConfiguration.mode === "injected",
      runnerConfiguration
    };
  }

  async queueBuild(payload: unknown, options: QueueBuildOptions = {}): Promise<QueueBuildResult> {
    const start = options.start ?? true;
    const request = normalizeBuildManifestPayload(payload);
    const existingRun = request.operationId ? await this.store.getRunByOperationId(request.operationId) : undefined;

    if (existingRun) {
      return { run: existingRun, duplicate: true };
    }

    const buildRunId = this.store.nextRunId(request.requestId);
    const workspace = createWorkspacePlan({
      buildRunId,
      manifest: request.manifest,
      rootDir: this.workspaceRoot
    });
    await prepareWorkspacePlan(workspace);

    const run = await this.store.createRun({
      buildRunId,
      operationId: request.operationId,
      platformMode: request.platformMode,
      workerId: this.workerId,
      manifest: request.manifest,
      workspace
    });

    if (start) {
      const execution = this.executeRun(run.build_run_id, request);

      if (options.waitForCompletion) {
        return { run: await execution, duplicate: false };
      }

      void execution.catch(() => undefined);
    }

    return { run, duplicate: false };
  }

  async getRun(buildRunId: string): Promise<BuildWorkerRun | undefined> {
    return this.store.getRun(buildRunId);
  }

  async executeRun(buildRunId: string, request?: NormalizedBuildRequest): Promise<BuildWorkerRun> {
    const queuedRun = await this.requireRun(buildRunId);
    const normalizedRequest =
      request ??
      ({
        requestId: queuedRun.request_id,
        platformMode: queuedRun.platformMode,
        manifest: queuedRun.manifest
      } satisfies NormalizedBuildRequest);
    const startedAt = this.store.now();

    await this.store.updateRun(
      buildRunId,
      {
        status: "building",
        started_at: queuedRun.started_at ?? startedAt,
        failure_reason: undefined
      },
      {
        action: "build_started",
        summary: `Build worker started ${buildRunId}.`,
        payload_json: {
          workspace_root: queuedRun.workspace.workspaceRoot,
          template_id: queuedRun.manifest.templateId
        }
      }
    );

    try {
      const runningRun = await this.requireRun(buildRunId);
      const context = this.createRunnerContext(buildRunId);
      const result = await this.runner.execute(
        {
          request: normalizedRequest,
          run: runningRun,
          workspace: runningRun.workspace
        },
        context
      );

      const checks = result.checks ?? [];

      if (checks.length > 0) {
        await this.store.updateRun(
          buildRunId,
          {
            status: "tests_running",
            checks
          },
          {
            action: "tests_recorded",
            summary: `Recorded ${checks.length} build check result${checks.length === 1 ? "" : "s"}.`,
            payload_json: {
              checks: checks.map((check) => ({ name: check.name, status: check.status }))
            }
          }
        );
      }

      const resultPatch = patchFromRunnerResult(result);
      await this.store.updateRun(
        buildRunId,
        {
          ...resultPatch,
          status: "artifact_capture"
        },
        {
          action: "artifact_capture",
          summary: "Captured runner result fields for downstream Codex/Git lanes.",
          payload_json: {
            generated_files: result.generatedFiles ?? [],
            artifacts: (result.artifacts ?? []).map((artifact) => ({ name: artifact.name, type: artifact.type }))
          }
        }
      );

      const finalStatus: NonNullable<BuildRunnerResult["status"]> = result.status ?? inferFinalStatus(checks);
      return this.store.updateRun(
        buildRunId,
        {
          status: finalStatus,
          failure_reason: result.failureReason,
          completed_at: isTerminalStatus(finalStatus) ? this.store.now() : undefined
        },
        {
          action: "build_finished",
          summary: finishSummary(buildRunId, finalStatus, result.failureReason),
          payload_json: {
            status: finalStatus,
            branch_name: result.branchName,
            commit_sha: result.commitSha,
            pr_url: result.prUrl
          }
        }
      );
    } catch (error) {
      const message = redactSensitiveText(error instanceof Error ? error.message : "Unknown build runner error.", {
        maxLength: 2_000
      });
      return this.store.updateRun(
        buildRunId,
        {
          status: "build_failed",
          failure_reason: message,
          completed_at: this.store.now()
        },
        {
          action: "build_failed",
          summary: `Build runner failed for ${buildRunId}.`,
          payload_json: {
            reason: message
          }
        }
      );
    }
  }

  private async requireRun(buildRunId: string): Promise<BuildWorkerRun> {
    const run = await this.store.getRun(buildRunId);

    if (!run) {
      throw new Error(`Build run not found: ${buildRunId}`);
    }

    return run;
  }

  private createRunnerContext(buildRunId: string): BuildRunnerContext {
    return {
      updateStatus: async (status, summary, patch = {}) =>
        this.store.updateRun(
          buildRunId,
          {
            ...patch,
            status
          },
          {
            action: "runner_status_updated",
            summary,
            payload_json: { status }
          }
        ),
      recordEvent: async (action, summary, payload_json = {}) =>
        this.store.addEvent(buildRunId, {
          action,
          summary,
          payload_json
        })
    };
  }
}

export function createBuildWorkerRuntime(options: BuildWorkerRuntimeOptions = {}): BuildWorkerRuntime {
  return new BuildWorkerRuntime(options);
}

const unconfiguredRunners = new WeakSet<BuildRunner>();

export function createUnconfiguredRunner(): BuildRunner {
  const runner: BuildRunner = {
    async execute() {
      return {
        status: "blocked",
        failureReason:
          "No Codex/Git runner is configured. Inject a BuildRunner from the Codex and Git evidence lanes to execute builds."
      };
    }
  };

  unconfiguredRunners.add(runner);
  return runner;
}

function normalizeRunner(runner: BuildWorkerRuntimeOptions["runner"]): BuildRunner {
  if (!runner) {
    return createCodexGitBuildRunner();
  }

  if (typeof runner === "function") {
    return {
      execute: runner,
      describeConfiguration: () => ({
        mode: "injected",
        codexEnabled: true,
        githubConfigured: Boolean(process.env.GITHUB_PAT_TOKEN),
        workspaceMode: "isolated-workspace",
        issues: []
      })
    };
  }

  return runner;
}

function isUnconfiguredRunner(runner: BuildRunner): boolean {
  return unconfiguredRunners.has(runner);
}

function describeRunnerConfiguration(runner: BuildRunner): BuildRunnerConfiguration {
  if (runner.describeConfiguration) {
    return runner.describeConfiguration();
  }

  if (isUnconfiguredRunner(runner)) {
    return {
      mode: "unconfigured",
      codexEnabled: false,
      githubConfigured: Boolean(process.env.GITHUB_PAT_TOKEN),
      workspaceMode: "isolated-workspace",
      issues: ["No BuildRunner was injected."]
    };
  }

  return {
    mode: "injected",
    codexEnabled: true,
    githubConfigured: Boolean(process.env.GITHUB_PAT_TOKEN),
    workspaceMode: "isolated-workspace",
    issues: []
  };
}

function patchFromRunnerResult(result: BuildRunnerResult): BuildRunPatch {
  const patch: BuildRunPatch = {};

  if (result.codexSessionId) patch.codex_session_id = result.codexSessionId;
  if (result.logsUri) patch.logs_uri = result.logsUri;
  if (result.branchName) patch.branch_name = result.branchName;
  if (result.commitSha) patch.commit_sha = result.commitSha;
  if (result.prUrl) patch.pr_url = result.prUrl;
  if (result.generatedFiles) patch.generated_files_json = result.generatedFiles;
  if (result.checks) patch.checks = result.checks;
  if (result.artifacts) patch.artifacts = result.artifacts;
  if (result.failureReason) patch.failure_reason = result.failureReason;

  return patch;
}

function inferFinalStatus(checks: BuildCheckResult[]): NonNullable<BuildRunnerResult["status"]> {
  return checks.some((check) => check.status === "failed") ? "tests_failed" : "awaiting_release_approval";
}

function finishSummary(buildRunId: string, status: BuildWorkerRunStatus, failureReason: string | undefined): string {
  if (failureReason) {
    return `Build run ${buildRunId} finished with ${status}: ${failureReason}`;
  }

  return `Build run ${buildRunId} finished with ${status}.`;
}

function isTerminalStatus(status: BuildWorkerRunStatus): boolean {
  return ["awaiting_release_approval", "build_failed", "tests_failed", "blocked", "cancelled"].includes(status);
}
