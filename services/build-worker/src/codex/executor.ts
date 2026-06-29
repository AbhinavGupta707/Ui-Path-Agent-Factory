import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";
import type { CodexCommand } from "./command.js";

export interface CodexCommandRunOptions {
  cwd: string;
  timeoutMs: number;
  maxOutputBytes?: number;
}

export interface CodexCommandRawResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  durationMs: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export interface CodexCommandExecutor {
  run(command: CodexCommand, options: CodexCommandRunOptions): Promise<CodexCommandRawResult>;
}

export class SpawnCodexCommandExecutor implements CodexCommandExecutor {
  async run(command: CodexCommand, options: CodexCommandRunOptions): Promise<CodexCommandRawResult> {
    const startedAt = performance.now();
    const maxOutputBytes = options.maxOutputBytes ?? 1_000_000;

    return await new Promise<CodexCommandRawResult>((resolve) => {
      let stdout = "";
      let stderr = "";
      let timedOut = false;
      let completed = false;
      let killTimer: NodeJS.Timeout | undefined;

      const child = spawn(command.executable, command.args, {
        cwd: options.cwd,
        env: createCodexProcessEnv(process.env),
        stdio: ["ignore", "pipe", "pipe"]
      });

      const timeout = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
        killTimer = setTimeout(() => child.kill("SIGKILL"), 2_000);
      }, options.timeoutMs);

      child.stdout.on("data", (chunk: Buffer) => {
        stdout = appendBounded(stdout, chunk.toString("utf8"), maxOutputBytes);
      });

      child.stderr.on("data", (chunk: Buffer) => {
        stderr = appendBounded(stderr, chunk.toString("utf8"), maxOutputBytes);
      });

      child.on("error", (error) => {
        if (completed) {
          return;
        }

        completed = true;
        clearTimeout(timeout);
        if (killTimer !== undefined) {
          clearTimeout(killTimer);
        }

        resolve({
          exitCode: 1,
          signal: null,
          durationMs: Math.round(performance.now() - startedAt),
          stdout,
          stderr: appendBounded(stderr, `${error.name}: ${error.message}`, maxOutputBytes),
          timedOut
        });
      });

      child.on("close", (exitCode, signal) => {
        if (completed) {
          return;
        }

        completed = true;
        clearTimeout(timeout);
        if (killTimer !== undefined) {
          clearTimeout(killTimer);
        }

        resolve({
          exitCode,
          signal,
          durationMs: Math.round(performance.now() - startedAt),
          stdout,
          stderr,
          timedOut
        });
      });
    });
  }
}

export function createCodexProcessEnv(source: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  const allowedNames = new Set([
    "CI",
    "COLORTERM",
    "HOME",
    "LANG",
    "LC_ALL",
    "LOGNAME",
    "PATH",
    "SHELL",
    "TERM",
    "TMPDIR",
    "USER",
    "XDG_CACHE_HOME",
    "XDG_CONFIG_HOME",
    "XDG_DATA_HOME"
  ]);

  for (const [name, value] of Object.entries(source)) {
    if (value === undefined) {
      continue;
    }

    if (allowedNames.has(name)) {
      env[name] = value;
    }
  }

  return env;
}

function appendBounded(current: string, addition: string, maxOutputBytes: number): string {
  const next = `${current}${addition}`;

  if (Buffer.byteLength(next, "utf8") <= maxOutputBytes) {
    return next;
  }

  return next.slice(-maxOutputBytes);
}
