import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  collectBuildEvidence,
  type BuildEvidenceResult
} from "../artifacts/result.js";
import {
  createSafeArtifactList,
  normalizeWorkspaceRelativePath,
  type EvidenceCheck
} from "../artifacts/index.js";
import type { GitCommandRunner } from "../git/index.js";
import type {
  BuildRunner,
  BuildRunnerContext,
  BuildRunnerInput,
  BuildRunnerResult
} from "../runtime.js";
import type { BuildArtifact, BuildCheckResult } from "../store.js";
import type { GitHubPullRequestClient } from "../github/index.js";
import type { CodexCommandExecutor } from "./executor.js";
import { assertCodexManifestSafe, normalizeCodexManifest, type NormalizedCodexManifest } from "./manifest.js";
import { redactSensitiveText, redactUnknownJson } from "./redaction.js";
import {
  runCodexBuild,
  runCodexReadiness,
  writeCodexWorkspaceInputs,
  type CodexBuildRunResult,
  type CodexRunAttempt
} from "./runner.js";

export type CodexLiveRunnerMode = "disabled" | "codex-cli";

export interface CodexLiveRunnerConfiguration {
  mode: CodexLiveRunnerMode;
  codexEnabled: boolean;
  codexReady?: boolean;
  executable: "codex";
  githubConfigured: boolean;
  workspaceMode: "isolated-workspace";
  model?: string;
  readinessSandbox: "read-only";
  buildSandbox: "workspace-write";
  jsonlCapture: boolean;
  maxRepairAttempts?: number;
  maxOutputBytes: number;
  maxJsonlLines: number;
  issues: string[];
}

export interface CodexGitBuildRunnerOptions {
  enabled?: boolean;
  executor?: CodexCommandExecutor;
  gitRunner?: GitCommandRunner;
  githubClient?: GitHubPullRequestClient;
  githubToken?: string;
  githubRemoteUrl?: string;
  baseBranch?: string;
  model?: string;
  readinessTimeoutMs?: number;
  buildTimeoutMs?: number;
  maxOutputBytes?: number;
}

const ENABLED_VALUES = new Set(["1", "true", "yes", "on"]);
const DEFAULT_MAX_OUTPUT_BYTES = 64_000;
const MAX_LOG_TEXT_LENGTH = 4_000;
const MAX_JSONL_LINES = 25;
const MAX_DISCOVERED_FILES = 200;

export class CodexGitBuildRunner implements BuildRunner {
  private readonly enabled: boolean;
  private readonly maxOutputBytes: number;

  constructor(private readonly options: CodexGitBuildRunnerOptions = {}) {
    this.enabled = options.enabled ?? isCodexEnabledFromEnv();
    this.maxOutputBytes = options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;
  }

  describeConfiguration(): CodexLiveRunnerConfiguration {
    const issues: string[] = [];

    if (!this.enabled) {
      issues.push("Set BUILD_WORKER_CODEX_ENABLED=true to allow live Codex CLI execution.");
    }

    return {
      mode: this.enabled ? "codex-cli" : "disabled",
      codexEnabled: this.enabled,
      executable: "codex",
      githubConfigured: Boolean(this.options.githubToken ?? process.env.GITHUB_PAT_TOKEN),
      workspaceMode: "isolated-workspace",
      model: this.options.model ?? process.env.CODEX_MODEL,
      readinessSandbox: "read-only",
      buildSandbox: "workspace-write",
      jsonlCapture: true,
      maxOutputBytes: this.maxOutputBytes,
      maxJsonlLines: MAX_JSONL_LINES,
      issues
    };
  }

  async execute(input: BuildRunnerInput, context: BuildRunnerContext): Promise<BuildRunnerResult> {
    const manifest = normalizeCodexManifest(input.request.manifest);
    const model = this.options.model ?? process.env.CODEX_MODEL ?? input.request.manifest.codexModel;
    const configuration = { ...this.describeConfiguration(), model };
    assertCodexManifestSafe(manifest);
    await writeCodexWorkspaceInputs(input.workspace.workspaceRoot, manifest);
    await context.recordEvent("codex_workspace_inputs_written", "Wrote approved manifest and AGENTS.md into the isolated workspace.", {
      workspace: workspaceInputEvidence(input, true),
      guardrails: guardrailEvidence(manifest, input)
    });
    await context.recordEvent("runner_configuration_checked", runnerConfigurationSummary(configuration), {
      runner: redactUnknownJson(configuration) as Record<string, unknown>
    });

    if (!configuration.codexEnabled) {
      const logsUri = await writeRunnerLog(input, {
        configuration,
        manifest,
        readiness: undefined,
        build: undefined,
        evidence: undefined,
        workspaceInputsWritten: true
      });

      return {
        status: "blocked",
        logsUri,
        branchName: input.request.manifest.branchName,
        failureReason:
          "Codex CLI execution is disabled. Set BUILD_WORKER_CODEX_ENABLED=true after local Codex readiness has been verified.",
        checks: [
          {
            name: "codex-runner-configuration",
            status: "skipped",
            summary: "Live Codex execution was not enabled for this worker process."
          }
        ],
        artifacts: [
          {
            name: "runner-configuration",
            type: "other",
            summary: "No Codex invocation occurred; the worker returned a safe degraded status."
          }
        ]
      };
    }

    await context.updateStatus("building", "Checking Codex CLI readiness before build execution.");
    const readiness = await runCodexReadiness({
      workspacePath: input.workspace.workspaceRoot,
      executor: this.options.executor,
      model,
      timeoutMs: this.options.readinessTimeoutMs,
      maxOutputBytes: this.maxOutputBytes
    });

    await context.recordEvent("codex_readiness_checked", readinessSummary(readiness), {
      codex: codexReadinessEvidence(readiness, model, input)
    });

    if (!readiness.succeeded) {
      const logsUri = await writeRunnerLog(input, {
        configuration: { ...configuration, codexReady: false },
        manifest,
        readiness,
        build: undefined,
        evidence: undefined,
        workspaceInputsWritten: true
      });

      return {
        status: "blocked",
        logsUri,
        branchName: input.request.manifest.branchName,
        checks: [
          {
            name: "codex-readiness",
            status: "failed",
            summary: readinessSummary(readiness)
          }
        ],
        failureReason: `Codex readiness failed: ${failureReasonFromAttempt(readiness)}`
      };
    }

    await context.updateStatus("building", "Codex CLI readiness passed; starting workspace-write build.");
    const build = await runCodexBuild({
      workspacePath: input.workspace.workspaceRoot,
      manifest: input.request.manifest,
      executor: this.options.executor,
      model,
      timeoutMs: this.options.buildTimeoutMs,
      maxOutputBytes: this.maxOutputBytes,
      maxRepairAttempts: input.request.manifest.maxRepairAttempts
    });

    await context.recordEvent("codex_build_completed", codexBuildSummary(build), {
      codex: {
        executable: configuration.executable,
        model,
        sandbox: configuration.buildSandbox,
        workspaceMode: configuration.workspaceMode,
        workspaceRoot: input.workspace.workspaceRoot,
        jsonlCapture: configuration.jsonlCapture,
        succeeded: build.succeeded,
        sessionId: build.sessionId,
        attempts: build.attempts.map(attemptEvidence),
        repairAttemptsUsed: build.repairAttemptsUsed
      }
    });

    const discoveredFiles = await discoverWorkspaceFiles(input.workspace.workspaceRoot);
    const allowedFiles = discoveredFiles.filter((file) => isAllowedByManifest(file, input.workspace.allowedFilePatterns));
    const forbiddenFiles = discoveredFiles.filter((file) => !isAllowedByManifest(file, input.workspace.allowedFilePatterns));
    const codexChecks = createCodexChecks(build, readiness, forbiddenFiles);
    const guardrailFailures = codexChecks.filter((check) =>
      ["manifest-allowlist", "workspace-inputs", "forbidden-actions"].includes(check.name) && check.status === "failed"
    );

    if (!build.succeeded || guardrailFailures.length > 0) {
      const logsUri = await writeRunnerLog(input, {
        configuration: { ...configuration, codexReady: true },
        manifest,
        readiness,
        build,
        evidence: undefined,
        discoveredFiles,
        forbiddenFiles,
        workspaceInputsWritten: build.workspaceInputsWritten
      });

      return {
        status: guardrailFailures.length > 0 ? "blocked" : "build_failed",
        codexSessionId: build.sessionId,
        logsUri,
        branchName: input.request.manifest.branchName,
        generatedFiles: allowedFiles,
        checks: codexChecks,
        artifacts: await artifactsFromFiles(allowedFiles, input.workspace.workspaceRoot),
        failureReason:
          guardrailFailures.length > 0
            ? guardrailFailureReason(forbiddenFiles, guardrailFailures)
            : build.failureReason
      };
    }

    await context.updateStatus("tests_running", "Collecting local diff, check, and release evidence.");
    const evidence = await collectBuildEvidence({
      workspaceRoot: input.workspace.workspaceRoot,
      requestId: input.request.requestId,
      buildRunId: input.run.build_run_id,
      checks: codexChecks.map(toEvidenceCheck),
      branchName: input.request.manifest.branchName,
      baseBranch: this.options.baseBranch,
      githubToken: this.options.githubToken,
      githubRemoteUrl: this.options.githubRemoteUrl,
      githubClient: this.options.githubClient,
      gitRunner: this.options.gitRunner
    });
    const generatedFiles = evidence.generatedFiles.length > 0 ? evidence.generatedFiles : allowedFiles;
    const logsUri = await writeRunnerLog(input, {
      configuration: { ...configuration, codexReady: true },
      manifest,
      readiness,
      build,
      evidence,
      discoveredFiles,
      workspaceInputsWritten: build.workspaceInputsWritten
    });

    return {
      status: evidence.releaseApproval.recommendedStatus,
      codexSessionId: build.sessionId,
      logsUri,
      branchName: evidence.branchName,
      commitSha: evidence.commitSha,
      prUrl: evidence.pullRequestUrl,
      generatedFiles,
      checks: codexChecks,
      artifacts: [
        ...artifactsFromEvidence(evidence),
        ...(evidence.artifacts.length === 0 ? await artifactsFromFiles(generatedFiles, input.workspace.workspaceRoot) : [])
      ],
      failureReason:
        evidence.releaseApproval.recommendedStatus === "blocked" ? evidence.releaseApproval.summary : undefined
    };
  }
}

export function createCodexGitBuildRunner(options: CodexGitBuildRunnerOptions = {}): CodexGitBuildRunner {
  return new CodexGitBuildRunner(options);
}

function isCodexEnabledFromEnv(): boolean {
  return ENABLED_VALUES.has((process.env.BUILD_WORKER_CODEX_ENABLED ?? "").trim().toLowerCase());
}

function runnerConfigurationSummary(configuration: CodexLiveRunnerConfiguration): string {
  if (!configuration.codexEnabled) {
    return "Codex/Git runner is present but live Codex execution is disabled.";
  }

  return configuration.githubConfigured
    ? "Codex/Git runner is enabled; GitHub PR creation may be attempted after local evidence is captured."
    : "Codex/Git runner is enabled; GitHub is not configured, so local branch and diff evidence will be returned.";
}

function readinessSummary(attempt: CodexRunAttempt): string {
  return attempt.succeeded
    ? `Codex readiness passed in ${attempt.durationMs}ms.`
    : `Codex readiness failed with exit ${attempt.exitCode ?? "unknown"}.`;
}

function codexBuildSummary(build: CodexBuildRunResult): string {
  if (build.succeeded) {
    return `Codex build completed after ${build.attempts.length} attempt(s).`;
  }

  return `Codex build failed after ${build.attempts.length} attempt(s): ${build.failureReason ?? "unknown failure"}`;
}

function createCodexChecks(
  build: CodexBuildRunResult,
  readiness: CodexRunAttempt,
  forbiddenFiles: string[]
): BuildCheckResult[] {
  const checks: BuildCheckResult[] = [
    {
      name: "codex-readiness",
      status: readiness.succeeded ? "passed" : "failed",
      summary: readinessSummary(readiness)
    },
    {
      name: "codex-build",
      status: build.succeeded ? "passed" : "failed",
      summary: codexBuildSummary(build)
    },
    {
      name: "workspace-inputs",
      status: build.workspaceInputsWritten ? "passed" : "failed",
      summary: build.workspaceInputsWritten
        ? "Approved build_manifest.json and AGENTS.md were written before live Codex execution."
        : "Approved workspace manifest and instructions were not written before Codex execution."
    },
    {
      name: "forbidden-actions",
      status: build.manifest.forbiddenActions.length > 0 ? "passed" : "failed",
      summary:
        build.manifest.forbiddenActions.length > 0
          ? `Forbidden actions remained active in the manifest and prompt guardrails: ${build.manifest.forbiddenActions.join(", ")}.`
          : "The manifest did not include forbidden action guardrails."
    }
  ];

  checks.push({
    name: "manifest-allowlist",
    status: forbiddenFiles.length === 0 ? "passed" : "failed",
    summary:
      forbiddenFiles.length === 0
        ? "All discovered workspace files stayed inside the manifest allowlist."
        : `Blocked ${forbiddenFiles.length} file(s) outside the manifest allowlist.`
  });

  return checks;
}

function guardrailFailureReason(forbiddenFiles: string[], guardrailFailures: BuildCheckResult[]): string {
  if (forbiddenFiles.length > 0) {
    return `Codex produced file(s) outside the manifest allowlist: ${forbiddenFiles.join(", ")}`;
  }

  return `Codex safety guardrails failed: ${guardrailFailures.map((check) => check.name).join(", ")}`;
}

function toEvidenceCheck(check: BuildCheckResult): EvidenceCheck {
  return {
    name: check.name,
    status: check.status,
    summary: check.summary,
    reportPath: check.report_uri
  };
}

async function writeRunnerLog(
  input: BuildRunnerInput,
  payload: {
    configuration: CodexLiveRunnerConfiguration;
    manifest: NormalizedCodexManifest;
    readiness?: CodexRunAttempt;
    build?: CodexBuildRunResult;
    evidence?: BuildEvidenceResult;
    discoveredFiles?: string[];
    forbiddenFiles?: string[];
    workspaceInputsWritten: boolean;
  }
): Promise<string> {
  const logPath = path.join(input.workspace.logsRoot, "codex-runner-evidence.json");
  const safePayload = redactUnknownJson({
    buildRunId: input.run.build_run_id,
    requestId: input.request.requestId,
    capturedAt: new Date().toISOString(),
    configuration: payload.configuration,
    workspace: workspaceInputEvidence(input, payload.workspaceInputsWritten),
    guardrails: guardrailEvidence(payload.manifest, input, payload.discoveredFiles, payload.forbiddenFiles),
    readiness: payload.readiness ? codexReadinessEvidence(payload.readiness, payload.configuration.model, input) : undefined,
    build: payload.build
      ? {
          succeeded: payload.build.succeeded,
          sessionId: payload.build.sessionId,
          repairAttemptsUsed: payload.build.repairAttemptsUsed,
          failureReason: payload.build.failureReason,
          attempts: payload.build.attempts.map(attemptEvidence)
        }
      : undefined,
    evidence: payload.evidence
      ? {
          branchName: payload.evidence.branchName,
          commitSha: payload.evidence.commitSha,
          diff: payload.evidence.diff,
          generatedFiles: payload.evidence.generatedFiles,
          githubMode: payload.evidence.githubMode,
          pullRequestUrl: payload.evidence.pullRequestUrl,
          localDiff: payload.evidence.localDiff,
          releaseApproval: payload.evidence.releaseApproval
        }
      : undefined,
    discoveredFiles: payload.discoveredFiles,
    forbiddenFiles: payload.forbiddenFiles
  });

  await writeFile(logPath, `${JSON.stringify(safePayload, null, 2)}\n`, "utf8");
  return logPath;
}

function attemptEvidence(attempt: CodexRunAttempt): Record<string, unknown> {
  return {
    attempt: attempt.attempt,
    phase: attempt.phase,
    command: attempt.command,
    exitCode: attempt.exitCode,
    signal: attempt.signal,
    durationMs: attempt.durationMs,
    sessionId: attempt.sessionId,
    timedOut: attempt.timedOut,
    succeeded: attempt.succeeded,
    stdout: redactSensitiveText(attempt.stdout, { maxLength: MAX_LOG_TEXT_LENGTH }),
    stderr: redactSensitiveText(attempt.stderr, { maxLength: MAX_LOG_TEXT_LENGTH }),
    jsonl: attempt.jsonl.slice(-MAX_JSONL_LINES)
  };
}

function codexReadinessEvidence(
  attempt: CodexRunAttempt,
  model: string | undefined,
  input: BuildRunnerInput
): Record<string, unknown> {
  return {
    executable: "codex",
    model,
    sandbox: "read-only",
    workspaceMode: "isolated-workspace",
    workspaceRoot: input.workspace.workspaceRoot,
    authStatus: classifyReadiness(attempt),
    jsonlCaptured: attempt.jsonl.length,
    ...attemptEvidence(attempt)
  };
}

function workspaceInputEvidence(input: BuildRunnerInput, written: boolean): Record<string, unknown> {
  return {
    mode: "isolated-workspace",
    workspaceRoot: input.workspace.workspaceRoot,
    manifestPath: input.workspace.manifestPath,
    agentInstructionsPath: input.workspace.agentInstructionsPath,
    logsRoot: input.workspace.logsRoot,
    outputApp: input.workspace.relativeOutputApp,
    written
  };
}

function guardrailEvidence(
  manifest: NormalizedCodexManifest,
  input: BuildRunnerInput,
  discoveredFiles: string[] = [],
  forbiddenFiles: string[] = []
): Record<string, unknown> {
  return {
    allowedFiles: input.workspace.allowedFilePatterns,
    forbiddenActions: manifest.forbiddenActions,
    sandboxOnly: manifest.sandboxOnly,
    piiPolicy: manifest.piiPolicy,
    discoveredFileCount: discoveredFiles.length,
    forbiddenFiles
  };
}

function classifyReadiness(attempt: CodexRunAttempt): string {
  if (attempt.succeeded) {
    return "ready";
  }

  if (attempt.timedOut) {
    return "timeout";
  }

  const text = `${attempt.stderr}\n${attempt.stdout}`.toLowerCase();

  if (/(enoent|not found|no such file|spawn codex)/u.test(text)) {
    return "executable_unavailable";
  }

  if (/(auth|login|credential|unauthori[sz]ed|401|token)/u.test(text)) {
    return "unauthenticated";
  }

  if (/\bmodel\b/u.test(text)) {
    return "model_unavailable";
  }

  return "unavailable";
}

function failureReasonFromAttempt(attempt: CodexRunAttempt): string {
  if (attempt.timedOut) {
    return `timed out after ${attempt.durationMs}ms`;
  }

  return redactSensitiveText(attempt.stderr.trim() || attempt.stdout.trim() || "no output captured", {
    maxLength: MAX_LOG_TEXT_LENGTH
  });
}

async function discoverWorkspaceFiles(workspaceRoot: string): Promise<string[]> {
  const discovered: string[] = [];
  await walk(workspaceRoot, workspaceRoot, discovered);
  return discovered
    .filter((file) => file !== "AGENTS.md" && file !== "build_manifest.json")
    .sort((left, right) => left.localeCompare(right))
    .slice(0, MAX_DISCOVERED_FILES);
}

async function walk(root: string, current: string, discovered: string[]): Promise<void> {
  if (discovered.length >= MAX_DISCOVERED_FILES) {
    return;
  }

  const entries = await readdir(current, { withFileTypes: true });

  for (const entry of entries) {
    if (discovered.length >= MAX_DISCOVERED_FILES) {
      return;
    }

    const absolutePath = path.join(current, entry.name);
    const relativePath = normalizeWorkspaceRelativePath(absolutePath, root);

    if (!relativePath || shouldSkipDiscoveredPath(relativePath)) {
      continue;
    }

    if (entry.isDirectory()) {
      await walk(root, absolutePath, discovered);
    } else if (entry.isFile()) {
      discovered.push(relativePath);
    }
  }
}

function shouldSkipDiscoveredPath(relativePath: string): boolean {
  const segments = relativePath.split("/");
  return segments.includes(".git");
}

function isAllowedByManifest(filePath: string, allowedPatterns: string[]): boolean {
  const normalized = normalizeWorkspaceRelativePath(filePath);
  return Boolean(normalized && allowedPatterns.some((pattern) => matchesAllowedPattern(normalized, pattern)));
}

function matchesAllowedPattern(filePath: string, rawPattern: string): boolean {
  const pattern = rawPattern.trim().replaceAll("\\", "/").replace(/^\.\//, "");

  if (pattern.endsWith("/**")) {
    const prefix = pattern.slice(0, -3);
    return filePath === prefix || filePath.startsWith(`${prefix}/`);
  }

  if (pattern.endsWith("/*")) {
    const prefix = pattern.slice(0, -1);
    const remainder = filePath.slice(prefix.length);
    return filePath.startsWith(prefix) && !remainder.includes("/");
  }

  return filePath === pattern;
}

async function artifactsFromFiles(files: string[], workspaceRoot: string): Promise<BuildArtifact[]> {
  const artifacts = await createSafeArtifactList(files, { workspaceRoot });
  return artifacts.map((artifact) => ({
    name: artifact.path,
    type: artifact.kind === "test" ? "test_report" : "generated_file",
    path: artifact.path,
    summary: `${artifact.changeType} ${artifact.kind} artifact`
  }));
}

function artifactsFromEvidence(evidence: BuildEvidenceResult): BuildArtifact[] {
  const artifacts: BuildArtifact[] = evidence.artifacts.map((artifact) => ({
    name: artifact.path,
    type: artifact.kind === "test" ? "test_report" : "generated_file",
    path: artifact.path,
    summary: `${artifact.changeType} ${artifact.kind} artifact`
  }));

  artifacts.push({
    name: "local-diff",
    type: "diff",
    summary: evidence.localDiff.summary
  });

  if (evidence.pullRequestUrl) {
    artifacts.push({
      name: "github-pull-request",
      type: "other",
      uri: evidence.pullRequestUrl,
      summary: "GitHub pull request evidence was created."
    });
  }

  return artifacts;
}
