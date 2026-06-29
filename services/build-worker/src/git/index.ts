import { spawn } from "node:child_process";
import path from "node:path";

export type GitChangeType = "added" | "modified" | "deleted" | "renamed" | "copied" | "unmerged" | "unknown";

export interface GitCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface GitCommandRunner {
  run(args: string[], options: { cwd: string }): Promise<GitCommandResult>;
}

export interface GitChangedFile {
  path: string;
  changeType: GitChangeType;
  indexStatus?: string;
  workingTreeStatus?: string;
  additions?: number;
  deletions?: number;
}

export interface GitDiffStat {
  filesChanged: number;
  insertions: number;
  deletions: number;
  untrackedFiles: number;
}

export interface GitBranchEvidence {
  name?: string;
  isDetached: boolean;
  source: "git" | "provided" | "generated" | "unavailable";
}

export interface GitWorkspaceEvidence {
  workspaceRoot: string;
  branch: GitBranchEvidence;
  commitSha?: string;
  shortCommitSha?: string;
  changedFiles: GitChangedFile[];
  diffStat: GitDiffStat;
  remoteUrl?: string;
}

export interface CollectGitEvidenceOptions {
  runner?: GitCommandRunner;
  branchName?: string;
  requestId?: string;
  remoteName?: string;
}

export class SpawnGitCommandRunner implements GitCommandRunner {
  async run(args: string[], options: { cwd: string }): Promise<GitCommandResult> {
    return new Promise((resolve) => {
      const child = spawn("git", args, {
        cwd: options.cwd,
        env: {
          ...process.env,
          GIT_TERMINAL_PROMPT: "0"
        },
        stdio: ["ignore", "pipe", "pipe"]
      });

      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];

      child.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
      child.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));
      child.on("error", (error) => {
        resolve({
          stdout: "",
          stderr: error.message,
          exitCode: 1
        });
      });
      child.on("close", (code) => {
        resolve({
          stdout: Buffer.concat(stdoutChunks).toString("utf8"),
          stderr: Buffer.concat(stderrChunks).toString("utf8"),
          exitCode: code ?? 1
        });
      });
    });
  }
}

export async function collectGitEvidence(
  workspaceRoot: string,
  options: CollectGitEvidenceOptions = {}
): Promise<GitWorkspaceEvidence> {
  const runner = options.runner ?? new SpawnGitCommandRunner();
  const cwd = path.resolve(workspaceRoot);

  const [branch, commitSha, changedFiles, numstatEntries, remoteUrl] = await Promise.all([
    getBranchEvidence(runner, cwd, options),
    getCommitSha(runner, cwd),
    getChangedFiles(runner, cwd),
    getNumstatEntries(runner, cwd),
    getRemoteUrl(runner, cwd, options.remoteName ?? "origin")
  ]);

  const changedFilesWithStats = mergeChangedFilesWithStats(changedFiles, numstatEntries);

  return {
    workspaceRoot: cwd,
    branch,
    commitSha,
    shortCommitSha: commitSha?.slice(0, 12),
    changedFiles: changedFilesWithStats,
    diffStat: summarizeDiffStat(changedFilesWithStats),
    remoteUrl
  };
}

export function sanitizeBranchName(input: string | undefined, fallback = "factory/build-evidence"): string {
  const fallbackBranch = fallback.length > 0 ? fallback : "factory/build-evidence";
  const initial = (input ?? "").trim() || fallbackBranch;
  const ascii = initial
    .normalize("NFKD")
    .replace(/[^\x20-\x7e]/g, "-")
    .replace(/[\s~^:?*[\\\u007f]+/g, "-")
    .replaceAll("@{", "-")
    .replaceAll("..", ".")
    .replace(/\/+/g, "/")
    .replace(/(^|\/)\.(?=\/|$)/g, "$1")
    .replace(/^\.+/, "")
    .replace(/[/.]+$/g, "");

  const parts = ascii
    .split("/")
    .map((part) => part.replace(/^-+/, "").replace(/-+$/, ""))
    .filter((part) => part.length > 0 && part !== "." && part !== "..");

  let candidate = parts.join("/");
  if (candidate.length === 0) {
    candidate = fallbackBranch;
  }

  if (candidate.endsWith(".lock")) {
    candidate = candidate.slice(0, -5);
  }

  if (candidate.startsWith("-")) {
    candidate = `branch-${candidate.slice(1)}`;
  }

  return candidate || "factory/build-evidence";
}

export function createEvidenceBranchName(input: { requestId?: string; prefix?: string }): string {
  const prefix = input.prefix ?? "factory";
  const requestId = input.requestId ?? "build";
  return sanitizeBranchName(`${prefix}/${requestId}`);
}

export function sanitizeCommitSha(input: string | undefined): string | undefined {
  const trimmed = input?.trim().toLowerCase();
  if (!trimmed) {
    return undefined;
  }

  const match = /^[0-9a-f]{7,40}$/.exec(trimmed);
  return match ? trimmed : undefined;
}

export function parseGitStatusPorcelain(stdout: string): GitChangedFile[] {
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .map((line) => {
      const indexStatus = line[0] ?? " ";
      const workingTreeStatus = line[1] ?? " ";
      const rawPath = line.slice(3);
      const filePath = rawPath.includes(" -> ") ? rawPath.split(" -> ").at(-1) ?? rawPath : rawPath;

      return {
        path: filePath,
        changeType: inferChangeType(indexStatus, workingTreeStatus),
        indexStatus: indexStatus.trim() || undefined,
        workingTreeStatus: workingTreeStatus.trim() || undefined
      };
    });
}

export function parseGitNumstat(stdout: string): GitChangedFile[] {
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .flatMap((line) => {
      const [additionsRaw, deletionsRaw, ...pathParts] = line.split("\t");
      const filePath = pathParts.join("\t");
      if (!additionsRaw || !deletionsRaw || filePath.length === 0) {
        return [];
      }

      return [
        {
          path: filePath,
          changeType: "modified" as const,
          additions: additionsRaw === "-" ? undefined : Number(additionsRaw),
          deletions: deletionsRaw === "-" ? undefined : Number(deletionsRaw)
        }
      ];
    });
}

export function sanitizeRemoteUrl(input: string | undefined): string | undefined {
  const remoteUrl = input?.trim();
  if (!remoteUrl) {
    return undefined;
  }

  if (remoteUrl.startsWith("http://") || remoteUrl.startsWith("https://")) {
    try {
      const parsed = new URL(remoteUrl);
      parsed.username = "";
      parsed.password = "";
      return parsed.toString().replace(/\/$/, "");
    } catch {
      return undefined;
    }
  }

  return remoteUrl.replace(/\/\/[^/@]+@/g, "//");
}

async function getBranchEvidence(
  runner: GitCommandRunner,
  cwd: string,
  options: CollectGitEvidenceOptions
): Promise<GitBranchEvidence> {
  const result = await runner.run(["rev-parse", "--abbrev-ref", "HEAD"], { cwd });
  if (result.exitCode === 0) {
    const branchName = result.stdout.trim();
    if (branchName && branchName !== "HEAD") {
      return {
        name: sanitizeBranchName(branchName),
        isDetached: false,
        source: "git"
      };
    }
  }

  if (options.branchName) {
    return {
      name: sanitizeBranchName(options.branchName),
      isDetached: true,
      source: "provided"
    };
  }

  if (options.requestId) {
    return {
      name: createEvidenceBranchName({ requestId: options.requestId }),
      isDetached: true,
      source: "generated"
    };
  }

  return {
    isDetached: true,
    source: "unavailable"
  };
}

async function getCommitSha(runner: GitCommandRunner, cwd: string): Promise<string | undefined> {
  const result = await runner.run(["rev-parse", "HEAD"], { cwd });
  if (result.exitCode !== 0) {
    return undefined;
  }

  return sanitizeCommitSha(result.stdout);
}

async function getChangedFiles(runner: GitCommandRunner, cwd: string): Promise<GitChangedFile[]> {
  const result = await runner.run(["status", "--porcelain=v1"], { cwd });
  if (result.exitCode !== 0) {
    return [];
  }

  return parseGitStatusPorcelain(result.stdout);
}

async function getNumstatEntries(runner: GitCommandRunner, cwd: string): Promise<GitChangedFile[]> {
  const result = await runner.run(["diff", "HEAD", "--numstat", "--"], { cwd });
  if (result.exitCode !== 0) {
    return [];
  }

  return parseGitNumstat(result.stdout);
}

async function getRemoteUrl(runner: GitCommandRunner, cwd: string, remoteName: string): Promise<string | undefined> {
  const result = await runner.run(["config", "--get", `remote.${remoteName}.url`], { cwd });
  if (result.exitCode !== 0) {
    return undefined;
  }

  return sanitizeRemoteUrl(result.stdout);
}

function mergeChangedFilesWithStats(changedFiles: GitChangedFile[], numstatEntries: GitChangedFile[]): GitChangedFile[] {
  const statsByPath = new Map(numstatEntries.map((entry) => [entry.path, entry]));

  return changedFiles.map((file) => {
    const stats = statsByPath.get(file.path);
    return {
      ...file,
      additions: stats?.additions,
      deletions: stats?.deletions
    };
  });
}

function summarizeDiffStat(changedFiles: GitChangedFile[]): GitDiffStat {
  return changedFiles.reduce<GitDiffStat>(
    (summary, file) => ({
      filesChanged: summary.filesChanged + 1,
      insertions: summary.insertions + (file.additions ?? 0),
      deletions: summary.deletions + (file.deletions ?? 0),
      untrackedFiles: summary.untrackedFiles + (file.indexStatus === "?" && file.workingTreeStatus === "?" ? 1 : 0)
    }),
    {
      filesChanged: 0,
      insertions: 0,
      deletions: 0,
      untrackedFiles: 0
    }
  );
}

function inferChangeType(indexStatus: string, workingTreeStatus: string): GitChangeType {
  const status = `${indexStatus}${workingTreeStatus}`;
  if (status === "??") {
    return "added";
  }

  if (status.includes("U")) {
    return "unmerged";
  }

  if (status.includes("R")) {
    return "renamed";
  }

  if (status.includes("C")) {
    return "copied";
  }

  if (status.includes("D")) {
    return "deleted";
  }

  if (status.includes("A")) {
    return "added";
  }

  if (status.includes("M")) {
    return "modified";
  }

  return "unknown";
}
