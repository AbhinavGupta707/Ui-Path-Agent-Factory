import type { BuildManifest } from "@agent-factory/shared-contracts";

export * from "./codex/index.js";
export * from "./manifest.js";
export * from "./runtime.js";
export * from "./server.js";
export * from "./store.js";
export * from "./workspace.js";

export interface CodexExecOptions {
  sandbox?: "read-only" | "workspace-write";
  model?: string;
  skipGitRepoCheck?: boolean;
}

export interface BuildPlan {
  requestId: string;
  branchName: string;
  outputApp: string;
  codexArgs: string[];
  summary: string;
}

export function createCodexExecArgs(prompt: string, options: CodexExecOptions = {}): string[] {
  const args = [
    "exec",
    "--sandbox",
    options.sandbox ?? "workspace-write",
    "-m",
    options.model ?? "gpt-5.5"
  ];

  if (options.skipGitRepoCheck ?? true) {
    args.push("--skip-git-repo-check");
  }

  args.push(prompt);
  return args;
}

export function createBuildPlan(manifest: BuildManifest): BuildPlan {
  const prompt = [
    `Build request ${manifest.requestId}.`,
    `Template: ${manifest.template}.`,
    `Output app: ${manifest.outputApp}.`,
    `Acceptance criteria: ${manifest.acceptanceCriteria.join("; ")}.`
  ].join(" ");

  return {
    requestId: manifest.requestId,
    branchName: manifest.branchName,
    outputApp: manifest.outputApp,
    codexArgs: createCodexExecArgs(prompt, {
      model: manifest.codexModel,
      sandbox: "workspace-write"
    }),
    summary: `Build ${manifest.outputApp} on ${manifest.branchName}`
  };
}
