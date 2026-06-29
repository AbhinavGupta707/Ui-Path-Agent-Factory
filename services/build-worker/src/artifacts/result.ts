import {
  createSafeArtifactList,
  isSafeArtifactPath,
  normalizeWorkspaceRelativePath,
  summarizeChecks,
  type BuildArtifact,
  type EvidenceCheck
} from "./index.js";
import { collectGitEvidence, createEvidenceBranchName, type GitChangedFile, type GitCommandRunner } from "../git/index.js";
import {
  createPullRequestBody,
  publishGitHubEvidence,
  type GitHubEvidenceResult,
  type GitHubPullRequestClient
} from "../github/index.js";

export interface CollectBuildEvidenceInput {
  workspaceRoot: string;
  requestId: string;
  buildRunId?: string;
  checks?: EvidenceCheck[];
  branchName?: string;
  baseBranch?: string;
  githubToken?: string;
  githubRemoteUrl?: string;
  githubClient?: GitHubPullRequestClient;
  gitRunner?: GitCommandRunner;
  capturedAt?: Date;
}

export interface SafeChangedFileEvidence {
  path: string;
  changeType: GitChangedFile["changeType"];
  additions?: number;
  deletions?: number;
}

export interface BuildEvidenceResult {
  requestId: string;
  buildRunId?: string;
  capturedAt: string;
  branchName: string;
  branchSource: "git" | "provided" | "generated" | "unavailable";
  branchIsDetached: boolean;
  commitSha?: string;
  shortCommitSha?: string;
  diff: {
    filesChanged: number;
    insertions: number;
    deletions: number;
    untrackedFiles: number;
    safeFilesChanged: number;
    excludedFiles: number;
    files: SafeChangedFileEvidence[];
  };
  artifacts: BuildArtifact[];
  generatedFiles: string[];
  checks: EvidenceCheck[];
  qualityGate: "passed" | "failed" | "warning" | "skipped";
  githubMode: GitHubEvidenceResult["githubMode"];
  pullRequestUrl?: string;
  github: GitHubEvidenceResult;
  rollbackNotes: string;
  releaseApproval: {
    recommendedStatus: "awaiting_release_approval" | "blocked";
    summary: string;
    rollbackNotes: string;
  };
  localDiff: {
    available: boolean;
    summary: string;
  };
}

export async function collectBuildEvidence(input: CollectBuildEvidenceInput): Promise<BuildEvidenceResult> {
  const gitEvidence = await collectGitEvidence(input.workspaceRoot, {
    branchName: input.branchName,
    requestId: input.requestId,
    runner: input.gitRunner
  });

  const branchName = gitEvidence.branch.name ?? createEvidenceBranchName({ requestId: input.requestId });
  const checks = normalizeChecks(input.checks ?? [], input.workspaceRoot);
  const artifacts = await createSafeArtifactList(gitEvidence.changedFiles, {
    workspaceRoot: input.workspaceRoot
  });
  const safeChangedFiles = createSafeChangedFiles(gitEvidence.changedFiles, input.workspaceRoot);
  const qualityGate = summarizeChecks(checks);
  const rollbackNotes = createRollbackNotes({
    branchName,
    commitSha: gitEvidence.commitSha,
    githubMode: "local-fallback"
  });

  const pullRequestBody = createPullRequestBody({
    requestId: input.requestId,
    buildRunId: input.buildRunId,
    branchName,
    commitSha: gitEvidence.commitSha,
    artifacts,
    checks,
    rollbackNotes
  });

  const github = await publishGitHubEvidence({
    token: input.githubToken ?? process.env.GITHUB_PAT_TOKEN,
    remoteUrl: input.githubRemoteUrl ?? gitEvidence.remoteUrl,
    branchName,
    baseBranch: input.baseBranch,
    title: `Agent Factory build evidence for ${input.requestId}`,
    body: pullRequestBody,
    client: input.githubClient
  });

  const finalRollbackNotes = createRollbackNotes({
    branchName,
    commitSha: gitEvidence.commitSha,
    githubMode: github.githubMode,
    pullRequestUrl: github.pullRequestUrl
  });

  const releaseSummary =
    qualityGate === "failed"
      ? "Build evidence is captured, but at least one check failed; keep release approval blocked."
      : "Build evidence is captured and ready for human release approval.";

  return {
    requestId: input.requestId,
    buildRunId: input.buildRunId,
    capturedAt: (input.capturedAt ?? new Date()).toISOString(),
    branchName,
    branchSource: gitEvidence.branch.source,
    branchIsDetached: gitEvidence.branch.isDetached,
    commitSha: gitEvidence.commitSha,
    shortCommitSha: gitEvidence.shortCommitSha,
    diff: {
      ...gitEvidence.diffStat,
      safeFilesChanged: safeChangedFiles.length,
      excludedFiles: Math.max(gitEvidence.changedFiles.length - safeChangedFiles.length, 0),
      files: safeChangedFiles
    },
    artifacts,
    generatedFiles: artifacts.map((artifact) => artifact.path),
    checks,
    qualityGate,
    githubMode: github.githubMode,
    pullRequestUrl: github.pullRequestUrl,
    github,
    rollbackNotes: finalRollbackNotes,
    releaseApproval: {
      recommendedStatus: qualityGate === "failed" ? "blocked" : "awaiting_release_approval",
      summary: releaseSummary,
      rollbackNotes: finalRollbackNotes
    },
    localDiff: {
      available: github.githubMode === "local-fallback",
      summary: createLocalDiffSummary({
        filesChanged: gitEvidence.diffStat.filesChanged,
        insertions: gitEvidence.diffStat.insertions,
        deletions: gitEvidence.diffStat.deletions,
        safeFilesChanged: safeChangedFiles.length,
        excludedFiles: Math.max(gitEvidence.changedFiles.length - safeChangedFiles.length, 0),
        reason: github.reason
      })
    }
  };
}

function createSafeChangedFiles(changedFiles: GitChangedFile[], workspaceRoot: string): SafeChangedFileEvidence[] {
  return changedFiles
    .flatMap((file) => {
      const normalized = normalizeWorkspaceRelativePath(file.path, workspaceRoot);
      if (!normalized || !isSafeArtifactPath(normalized)) {
        return [];
      }

      return [
        {
          path: normalized,
          changeType: file.changeType,
          additions: file.additions,
          deletions: file.deletions
        }
      ];
    })
    .sort((left, right) => left.path.localeCompare(right.path));
}

function normalizeChecks(checks: EvidenceCheck[], workspaceRoot: string): EvidenceCheck[] {
  return checks.map((check) => {
    if (!check.reportPath) {
      return check;
    }

    const normalizedReportPath = normalizeWorkspaceRelativePath(check.reportPath, workspaceRoot);
    if (!normalizedReportPath || !isSafeArtifactPath(normalizedReportPath)) {
      const { reportPath: _reportPath, ...safeCheck } = check;
      return safeCheck;
    }

    return {
      ...check,
      reportPath: normalizedReportPath
    };
  });
}

function createRollbackNotes(input: { branchName: string; commitSha?: string; githubMode: string; pullRequestUrl?: string }): string {
  const reviewTarget =
    input.githubMode === "pull-request" && input.pullRequestUrl
      ? `review or close ${input.pullRequestUrl}`
      : `review the local diff on branch ${input.branchName}`;

  if (input.commitSha) {
    return `Keep deployment sandbox-only until release approval. To roll back after approval, revert commit ${input.commitSha} on ${input.branchName}; before approval, ${reviewTarget}.`;
  }

  return `Keep deployment sandbox-only until release approval. No commit SHA was detected, so preserve the workspace diff and ${reviewTarget} before release.`;
}

function createLocalDiffSummary(input: {
  filesChanged: number;
  insertions: number;
  deletions: number;
  safeFilesChanged: number;
  excludedFiles: number;
  reason?: string;
}): string {
  const exclusion = input.excludedFiles > 0 ? `; ${input.excludedFiles} unsafe or generated path(s) excluded from artifacts` : "";
  const reason = input.reason ? ` ${input.reason}` : "";
  return `${input.filesChanged} changed file(s), ${input.safeFilesChanged} safe artifact(s), +${input.insertions}/-${input.deletions}${exclusion}.${reason}`;
}
