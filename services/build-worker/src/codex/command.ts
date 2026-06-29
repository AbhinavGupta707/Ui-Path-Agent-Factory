import { redactSensitiveText } from "./redaction.js";

export type CodexSandbox = "read-only" | "workspace-write";

export interface CodexCommandOptions {
  sandbox?: CodexSandbox;
  model?: string;
  json?: boolean;
  skipGitRepoCheck?: boolean;
}

export interface CodexCommand {
  executable: "codex";
  args: string[];
  displayCommand: string;
  prompt: string;
  sandbox: CodexSandbox;
  json: boolean;
  model?: string;
}

export const CODEX_READY_PROMPT = "Reply only: Codex ready.";

export function createCodexCommand(prompt: string, options: CodexCommandOptions = {}): CodexCommand {
  const sandbox = options.sandbox ?? "workspace-write";
  const json = options.json ?? false;
  const args = ["exec", "--sandbox", sandbox];

  if (options.skipGitRepoCheck ?? true) {
    args.push("--skip-git-repo-check");
  }

  if (json) {
    args.push("--json");
  }

  if (options.model !== undefined && options.model.trim().length > 0) {
    args.push("-m", options.model);
  }

  args.push(prompt);

  return {
    executable: "codex",
    args,
    displayCommand: formatDisplayCommand("codex", args),
    prompt,
    sandbox,
    json,
    model: options.model
  };
}

export function createCodexReadinessCommand(model?: string): CodexCommand {
  return createCodexCommand(CODEX_READY_PROMPT, {
    sandbox: "read-only",
    skipGitRepoCheck: true,
    model
  });
}

export function formatDisplayCommand(executable: string, args: string[]): string {
  return [executable, ...args].map((part) => quoteShellArg(redactSensitiveText(part))).join(" ");
}

function quoteShellArg(value: string): string {
  if (/^[A-Za-z0-9_./:=+-]+$/u.test(value)) {
    return value;
  }

  return `'${value.replace(/'/gu, "'\\''")}'`;
}
