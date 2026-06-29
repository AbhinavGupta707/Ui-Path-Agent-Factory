import type { BuildArtifact, EvidenceCheck } from "../artifacts/index.js";

export type GitHubMode = "pull-request" | "local-fallback";

export interface GitHubRepositoryRef {
  owner: string;
  repo: string;
}

export interface GitHubPullRequestCreateInput extends GitHubRepositoryRef {
  token: string;
  title: string;
  body: string;
  headBranch: string;
  baseBranch: string;
}

export interface GitHubPullRequestCreateResult {
  url: string;
  number?: number;
}

export interface GitHubPullRequestClient {
  createPullRequest(input: GitHubPullRequestCreateInput): Promise<GitHubPullRequestCreateResult>;
}

export interface PublishGitHubEvidenceInput {
  token?: string;
  remoteUrl?: string;
  branchName?: string;
  baseBranch?: string;
  title: string;
  body: string;
  client?: GitHubPullRequestClient;
}

export interface GitHubEvidenceResult {
  githubMode: GitHubMode;
  pullRequestUrl?: string;
  pullRequestNumber?: number;
  repository?: GitHubRepositoryRef;
  reason?: string;
}

export interface PullRequestBodyInput {
  requestId: string;
  buildRunId?: string;
  branchName?: string;
  commitSha?: string;
  artifacts: BuildArtifact[];
  checks: EvidenceCheck[];
  rollbackNotes: string;
}

export async function publishGitHubEvidence(input: PublishGitHubEvidenceInput): Promise<GitHubEvidenceResult> {
  if (!input.token) {
    return {
      githubMode: "local-fallback",
      reason: "GITHUB_PAT_TOKEN is not configured; returning local branch and diff evidence."
    };
  }

  if (!input.remoteUrl) {
    return {
      githubMode: "local-fallback",
      reason: "No GitHub remote URL is configured for this workspace."
    };
  }

  const repository = parseGitHubRepository(input.remoteUrl);
  if (!repository) {
    return {
      githubMode: "local-fallback",
      reason: "The configured git remote is not a supported GitHub repository URL."
    };
  }

  if (!input.branchName) {
    return {
      githubMode: "local-fallback",
      repository,
      reason: "No branch name is available for pull request creation."
    };
  }

  if (!input.client) {
    return {
      githubMode: "local-fallback",
      repository,
      reason: "GITHUB_PAT_TOKEN is present, but no GitHub client was injected."
    };
  }

  const pullRequest = await input.client.createPullRequest({
    ...repository,
    token: input.token,
    title: input.title,
    body: input.body,
    headBranch: input.branchName,
    baseBranch: input.baseBranch ?? "main"
  });

  return {
    githubMode: "pull-request",
    pullRequestUrl: pullRequest.url,
    pullRequestNumber: pullRequest.number,
    repository
  };
}

export function parseGitHubRepository(remoteUrl: string): GitHubRepositoryRef | undefined {
  const trimmed = remoteUrl.trim().replace(/\.git$/, "");
  if (trimmed.length === 0) {
    return undefined;
  }

  if (trimmed.startsWith("git@github.com:")) {
    const repoPath = trimmed.replace("git@github.com:", "");
    return parseOwnerRepo(repoPath);
  }

  if (trimmed.startsWith("ssh://git@github.com/")) {
    const repoPath = trimmed.replace("ssh://git@github.com/", "");
    return parseOwnerRepo(repoPath);
  }

  if (trimmed.startsWith("https://github.com/") || trimmed.startsWith("http://github.com/")) {
    try {
      const parsed = new URL(trimmed);
      return parseOwnerRepo(parsed.pathname.replace(/^\//, ""));
    } catch {
      return undefined;
    }
  }

  return undefined;
}

export function createPullRequestBody(input: PullRequestBodyInput): string {
  const artifactLines =
    input.artifacts.length === 0
      ? ["- No safe changed-file artifacts were detected."]
      : input.artifacts.map((artifact) => `- ${artifact.path} (${artifact.changeType}, ${artifact.kind})`);

  const checkLines =
    input.checks.length === 0
      ? ["- No checks were supplied by the worker lane yet."]
      : input.checks.map((check) => `- ${check.name}: ${check.status}${check.summary ? ` - ${check.summary}` : ""}`);

  return [
    `Request: ${input.requestId}`,
    input.buildRunId ? `Build run: ${input.buildRunId}` : undefined,
    input.branchName ? `Branch: ${input.branchName}` : undefined,
    input.commitSha ? `Commit: ${input.commitSha}` : undefined,
    "",
    "## Safe Artifact Evidence",
    ...artifactLines,
    "",
    "## Checks",
    ...checkLines,
    "",
    "## Rollback Notes",
    input.rollbackNotes
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");
}

function parseOwnerRepo(repoPath: string): GitHubRepositoryRef | undefined {
  const [owner, repo, ...rest] = repoPath.split("/").filter(Boolean);
  if (!owner || !repo || rest.length > 0) {
    return undefined;
  }

  return {
    owner,
    repo
  };
}
