import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  createCodexCommand,
  createCodexReadinessCommand,
  type CodexCommand
} from "./command.js";
import {
  SpawnCodexCommandExecutor,
  type CodexCommandExecutor,
  type CodexCommandRawResult
} from "./executor.js";
import {
  assertCodexManifestSafe,
  normalizeCodexManifest,
  type CodexManifestInput,
  type NormalizedCodexManifest
} from "./manifest.js";
import {
  renderCodexBuildPrompt,
  renderCodexRepairPrompt,
  renderWorkspaceAgentsMarkdown,
  type CodexFailureSummary
} from "./prompts.js";
import { redactSensitiveText, redactUnknownJson } from "./redaction.js";

export interface CodexRunAttempt {
  attempt: number;
  phase: "build" | "repair" | "readiness";
  command: string;
  args: string[];
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  durationMs: number;
  stdout: string;
  stderr: string;
  jsonl: CodexJsonLine[];
  sessionId?: string;
  timedOut: boolean;
  succeeded: boolean;
}

export interface CodexJsonLine {
  raw: string;
  parsed?: unknown;
  message?: string;
}

export interface CodexBuildRunOptions {
  workspacePath: string;
  manifest: CodexManifestInput;
  executor?: CodexCommandExecutor;
  model?: string;
  timeoutMs?: number;
  maxOutputBytes?: number;
  maxRepairAttempts?: number;
  writeWorkspaceInputs?: boolean;
}

export interface CodexBuildRunResult {
  succeeded: boolean;
  manifest: NormalizedCodexManifest;
  sessionId?: string;
  attempts: CodexRunAttempt[];
  repairAttemptsUsed: number;
  failureReason?: string;
  workspaceInputsWritten: boolean;
}

export interface CodexReadinessOptions {
  workspacePath: string;
  executor?: CodexCommandExecutor;
  model?: string;
  timeoutMs?: number;
  maxOutputBytes?: number;
}

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;
const READINESS_TIMEOUT_MS = 60 * 1000;

export async function runCodexBuild(options: CodexBuildRunOptions): Promise<CodexBuildRunResult> {
  const manifest = normalizeCodexManifest(options.manifest);
  assertCodexManifestSafe(manifest);

  if (options.writeWorkspaceInputs ?? true) {
    await writeCodexWorkspaceInputs(options.workspacePath, manifest);
  }

  const executor = options.executor ?? new SpawnCodexCommandExecutor();
  const attempts: CodexRunAttempt[] = [];
  const model = options.model ?? manifest.codexModel;
  const buildPrompt = renderCodexBuildPrompt(manifest);
  const buildCommand = createCodexCommand(buildPrompt, {
    sandbox: "workspace-write",
    skipGitRepoCheck: true,
    json: true,
    model
  });

  attempts.push(
    await executeCodexAttempt(buildCommand, executor, options, {
      phase: "build",
      attempt: 0
    })
  );

  let repairAttemptsUsed = 0;
  const maxRepairAttempts = Math.max(
    0,
    Math.min(3, Math.trunc(options.maxRepairAttempts ?? manifest.maxRepairAttempts))
  );

  while (!lastAttempt(attempts).succeeded && repairAttemptsUsed < maxRepairAttempts) {
    repairAttemptsUsed += 1;
    const repairPrompt = renderCodexRepairPrompt(
      manifest,
      createFailureSummary(lastAttempt(attempts)),
      repairAttemptsUsed
    );
    const repairCommand = createCodexCommand(repairPrompt, {
      sandbox: "workspace-write",
      skipGitRepoCheck: true,
      json: true,
      model
    });

    attempts.push(
      await executeCodexAttempt(repairCommand, executor, options, {
        phase: "repair",
        attempt: repairAttemptsUsed
      })
    );
  }

  const finalAttempt = lastAttempt(attempts);

  return {
    succeeded: finalAttempt.succeeded,
    manifest,
    sessionId: firstSessionId(attempts),
    attempts,
    repairAttemptsUsed,
    failureReason: finalAttempt.succeeded ? undefined : failureReason(finalAttempt),
    workspaceInputsWritten: options.writeWorkspaceInputs ?? true
  };
}

export async function runCodexReadiness(
  options: CodexReadinessOptions
): Promise<CodexRunAttempt> {
  const executor = options.executor ?? new SpawnCodexCommandExecutor();
  const command = createCodexReadinessCommand(options.model);

  return executeCodexAttempt(
    command,
    executor,
    {
      workspacePath: options.workspacePath,
      timeoutMs: options.timeoutMs ?? READINESS_TIMEOUT_MS,
      maxOutputBytes: options.maxOutputBytes
    },
    {
      phase: "readiness",
      attempt: 0
    }
  );
}

export async function writeCodexWorkspaceInputs(
  workspacePath: string,
  manifest: NormalizedCodexManifest
): Promise<void> {
  const workspaceRoot = path.resolve(workspacePath);
  await mkdir(workspaceRoot, { recursive: true });

  await Promise.all([
    writeFileInside(
      workspaceRoot,
      "build_manifest.json",
      `${JSON.stringify(toWorkspaceManifest(manifest), null, 2)}\n`
    ),
    writeFileInside(workspaceRoot, "AGENTS.md", `${renderWorkspaceAgentsMarkdown(manifest)}\n`)
  ]);
}

export function createFailureSummary(attempt: CodexRunAttempt): CodexFailureSummary {
  return {
    exitCode: attempt.exitCode,
    timedOut: attempt.timedOut,
    durationMs: attempt.durationMs,
    stdout: redactSensitiveText(attempt.stdout, { maxLength: 2_000 }),
    stderr: redactSensitiveText(attempt.stderr, { maxLength: 2_000 }),
    jsonlMessages: attempt.jsonl
      .map((line) => line.message ?? line.raw)
      .filter((line) => line.trim().length > 0)
      .slice(-10)
  };
}

async function executeCodexAttempt(
  command: CodexCommand,
  executor: CodexCommandExecutor,
  options: Pick<CodexBuildRunOptions, "workspacePath" | "timeoutMs" | "maxOutputBytes">,
  attempt: Pick<CodexRunAttempt, "phase" | "attempt">
): Promise<CodexRunAttempt> {
  const rawResult = await executor.run(command, {
    cwd: path.resolve(options.workspacePath),
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    maxOutputBytes: options.maxOutputBytes
  });

  return shapeAttempt(command, rawResult, attempt);
}

function shapeAttempt(
  command: CodexCommand,
  result: CodexCommandRawResult,
  attempt: Pick<CodexRunAttempt, "phase" | "attempt">
): CodexRunAttempt {
  const stdout = redactSensitiveText(result.stdout);
  const stderr = redactSensitiveText(result.stderr);
  const jsonl = parseJsonl(stdout);
  const sessionId = inferSessionId(jsonl, stdout, stderr);

  return {
    attempt: attempt.attempt,
    phase: attempt.phase,
    command: command.displayCommand,
    args: command.args.map((arg) => redactSensitiveText(arg)),
    exitCode: result.exitCode,
    signal: result.signal,
    durationMs: result.durationMs,
    stdout,
    stderr,
    jsonl,
    sessionId,
    timedOut: result.timedOut,
    succeeded: result.exitCode === 0 && !result.timedOut
  };
}

function parseJsonl(stdout: string): CodexJsonLine[] {
  return stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const raw = redactSensitiveText(line);

      try {
        const parsed = redactUnknownJson(JSON.parse(raw));
        return {
          raw,
          parsed,
          message: extractJsonMessage(parsed)
        };
      } catch {
        return { raw };
      }
    });
}

function extractJsonMessage(parsed: unknown): string | undefined {
  if (parsed === null || typeof parsed !== "object") {
    return undefined;
  }

  const candidate = parsed as Record<string, unknown>;
  const stringFields = ["message", "summary", "text", "event", "type"];
  const values = stringFields
    .map((field) => candidate[field])
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  return values.length > 0 ? values.join(" ") : undefined;
}

function inferSessionId(jsonl: CodexJsonLine[], stdout: string, stderr: string): string | undefined {
  for (const line of jsonl) {
    const parsedSessionId = sessionIdFromParsed(line.parsed);
    if (parsedSessionId !== undefined) {
      return parsedSessionId;
    }
  }

  const textMatch = /\b(?:session|conversation)[_-]?id\s*[:=]\s*([A-Za-z0-9_-]{8,})/iu.exec(
    `${stdout}\n${stderr}`
  );

  return textMatch?.[1];
}

function sessionIdFromParsed(parsed: unknown): string | undefined {
  if (parsed === null || typeof parsed !== "object") {
    return undefined;
  }

  const candidate = parsed as Record<string, unknown>;
  const directKeys = ["session_id", "sessionId", "conversation_id", "conversationId"];

  for (const key of directKeys) {
    const value = candidate[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  const nested = candidate["session"];
  if (nested !== null && typeof nested === "object") {
    const nestedId = (nested as Record<string, unknown>)["id"];
    if (typeof nestedId === "string" && nestedId.trim().length > 0) {
      return nestedId;
    }
  }

  return undefined;
}

function failureReason(attempt: CodexRunAttempt): string {
  if (attempt.timedOut) {
    return `Codex ${attempt.phase} attempt timed out after ${attempt.durationMs}ms.`;
  }

  const detail = attempt.stderr.trim() || attempt.stdout.trim() || "No output captured.";
  return redactSensitiveText(`Codex ${attempt.phase} attempt exited ${attempt.exitCode}: ${detail}`, {
    maxLength: 2_000
  });
}

function firstSessionId(attempts: CodexRunAttempt[]): string | undefined {
  return attempts.find((attempt) => attempt.sessionId !== undefined)?.sessionId;
}

function lastAttempt(attempts: CodexRunAttempt[]): CodexRunAttempt {
  const attempt = attempts.at(-1);

  if (attempt === undefined) {
    throw new Error("Codex runner has no attempts to inspect.");
  }

  return attempt;
}

async function writeFileInside(root: string, relativePath: string, contents: string): Promise<void> {
  const targetPath = path.resolve(root, relativePath);

  if (!targetPath.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Refusing to write outside Codex workspace: ${relativePath}`);
  }

  await writeFile(targetPath, contents, "utf8");
}

function toWorkspaceManifest(manifest: NormalizedCodexManifest): Record<string, unknown> {
  return {
    request_id: manifest.requestId,
    manifest_id: manifest.manifestId,
    template_id: manifest.templateId,
    artifact_type: manifest.artifactType,
    branch_name: manifest.branchName,
    output_app: manifest.outputApp,
    acceptance_criteria: manifest.acceptanceCriteria,
    allowed_files: manifest.allowedFiles,
    approved_data_sources: manifest.approvedDataSources,
    approved_metrics: manifest.approvedMetrics,
    required_filters: manifest.requiredFilters,
    pii_policy: manifest.piiPolicy,
    forbidden_actions: manifest.forbiddenActions,
    output_targets: manifest.outputTargets,
    max_repair_attempts: manifest.maxRepairAttempts,
    sandbox_only: manifest.sandboxOnly
  };
}

export const codexRunnerDefaults = {
  buildTimeoutMs: DEFAULT_TIMEOUT_MS,
  readinessTimeoutMs: READINESS_TIMEOUT_MS
} as const;
