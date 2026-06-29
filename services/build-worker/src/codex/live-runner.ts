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
import { redactSensitiveText, redactUnknownJson } from "./redaction.js";
import { runCodexBuild, runCodexReadiness, type CodexBuildRunResult, type CodexRunAttempt } from "./runner.js";

export type CodexLiveRunnerMode = "disabled" | "codex-cli";

export interface CodexLiveRunnerConfiguration {
  mode: CodexLiveRunnerMode;
  codexEnabled: boolean;
  codexReady?: boolean;
  githubConfigured: boolean;
  workspaceMode: "isolated-workspace";
  model?: string;
  maxRepairAttempts?: number;
  maxOutputBytes: number;
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
      githubConfigured: Boolean(this.options.githubToken ?? process.env.GITHUB_PAT_TOKEN),
      workspaceMode: "isolated-workspace",
      model: this.options.model ?? process.env.CODEX_MODEL,
      maxOutputBytes: this.maxOutputBytes,
      issues
    };
  }

  async execute(input: BuildRunnerInput, context: BuildRunnerContext): Promise<BuildRunnerResult> {
    const configuration = this.describeConfiguration();
    await context.recordEvent("runner_configuration_checked", runnerConfigurationSummary(configuration), {
      runner: redactUnknownJson(configuration) as Record<string, unknown>
    });

    if (!configuration.codexEnabled) {
      return {
        status: "blocked",
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
    const model = this.options.model ?? process.env.CODEX_MODEL ?? input.request.manifest.codexModel;
    const readiness = await runCodexReadiness({
      workspacePath: input.workspace.workspaceRoot,
      executor: this.options.executor,
      model,
      timeoutMs: this.options.readinessTimeoutMs,
      maxOutputBytes: this.maxOutputBytes
    });

    await context.recordEvent("codex_readiness_checked", readinessSummary(readiness), {
      codex: attemptEvidence(readiness)
    });

    if (!readiness.succeeded) {
      const logsUri = await writeRunnerLog(input, {
        configuration: { ...configuration, codexReady: false },
        readiness,
        build: undefined,
        evidence: undefined
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

    if (!build.succeeded || forbiddenFiles.length > 0) {
      const logsUri = await writeRunnerLog(input, {
        configuration: { ...configuration, codexReady: true },
        readiness,
        build,
        evidence: undefined,
        discoveredFiles,
        forbiddenFiles
      });

      return {
        status: forbiddenFiles.length > 0 ? "blocked" : "build_failed",
        codexSessionId: build.sessionId,
        logsUri,
        branchName: input.request.manifest.branchName,
        generatedFiles: allowedFiles,
        checks: codexChecks,
        artifacts: await artifactsFromFiles(allowedFiles, input.workspace.workspaceRoot),
        failureReason:
          forbiddenFiles.length > 0
            ? `Codex produced file(s) outside the manifest allowlist: ${forbiddenFiles.join(", ")}`
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
      readiness,
      build,
      evidence,
      discoveredFiles
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
    readiness?: CodexRunAttempt;
    build?: CodexBuildRunResult;
    evidence?: BuildEvidenceResult;
    discoveredFiles?: string[];
    forbiddenFiles?: string[];
  }
): Promise<string> {
  const logPath = path.join(input.workspace.logsRoot, "codex-runner-evidence.json");
  const safePayload = redactUnknownJson({
    buildRunId: input.run.build_run_id,
    requestId: input.request.requestId,
    capturedAt: new Date().toISOString(),
    configuration: payload.configuration,
    readiness: payload.readiness ? attemptEvidence(payload.readiness) : undefined,
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
