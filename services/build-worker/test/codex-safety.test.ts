import { describe, expect, it } from "vitest";
import { createBuildPlan, createCodexExecArgs } from "../src/index.js";

const secretPatterns = [
  /GITHUB_PAT_TOKEN\s*=\s*[\w.-]+/gi,
  /Bearer\s+[\w.-]+/gi,
  /token-[\w.-]+/gi
];

const rawPiiPatterns = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g,
  /\b(Avery Morgan|Jordan Lee)\b/g
];

interface FakeCodexResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

interface RepairRun {
  finalStatus: "completed" | "failed";
  attempts: number;
  repaired: boolean;
  transcript: string[];
}

function redactWorkerEvidence(value: string): string {
  let redacted = value;
  for (const pattern of secretPatterns) {
    redacted = redacted.replace(pattern, "[REDACTED_SECRET]");
  }
  for (const pattern of rawPiiPatterns) {
    redacted = redacted.replace(pattern, "[REDACTED_PII]");
  }
  return redacted;
}

function scanWorkerEvidence(values: string[]): string[] {
  const joined = values.join("\n");
  const issues: string[] = [];

  for (const pattern of secretPatterns) {
    if (pattern.test(joined)) {
      issues.push("secret");
    }
    pattern.lastIndex = 0;
  }

  for (const pattern of rawPiiPatterns) {
    if (pattern.test(joined)) {
      issues.push("raw_pii");
    }
    pattern.lastIndex = 0;
  }

  return issues;
}

async function runWithBoundedRepair(
  runner: (attempt: number) => Promise<FakeCodexResult>,
  maxRepairAttempts: number
): Promise<RepairRun> {
  const transcript: string[] = [];
  let attempts = 0;

  for (let attempt = 0; attempt <= maxRepairAttempts; attempt += 1) {
    attempts += 1;
    const result = await runner(attempt);
    transcript.push(redactWorkerEvidence(result.stdout));
    transcript.push(redactWorkerEvidence(result.stderr));

    if (result.exitCode === 0) {
      return {
        finalStatus: "completed",
        attempts,
        repaired: attempt > 0,
        transcript
      };
    }
  }

  return {
    finalStatus: "failed",
    attempts,
    repaired: false,
    transcript
  };
}

describe("Codex command safety", () => {
  it("defaults to workspace-write, JSON-free shell args, and skip-git-repo-check", () => {
    const prompt = "Use build_manifest.json and AGENTS.md. Do not show raw PII.";

    expect(createCodexExecArgs(prompt)).toEqual([
      "exec",
      "--sandbox",
      "workspace-write",
      "-m",
      "gpt-5.5",
      "--skip-git-repo-check",
      prompt
    ]);
  });

  it("preserves an explicit read-only smoke sandbox without dropping git repo bypass", () => {
    expect(createCodexExecArgs("Reply ready.", { sandbox: "read-only" })).toContain("read-only");
    expect(createCodexExecArgs("Reply ready.", { sandbox: "read-only" })).toContain("--skip-git-repo-check");
  });

  it("keeps build plans on the Customer360 workspace-write path", () => {
    const plan = createBuildPlan({
      requestId: "REQ-2026-001",
      template: "customer360-dashboard",
      branchName: "factory/REQ-2026-001-customer360",
      outputApp: "apps/customer360-template",
      acceptanceCriteria: ["Dashboard builds", "Risk accounts are visible"],
      permissions: [],
      codexModel: "gpt-5.5"
    });

    expect(plan.codexArgs).toContain("workspace-write");
    expect(plan.codexArgs).toContain("--skip-git-repo-check");
    expect(plan.summary).toBe("Build apps/customer360-template on factory/REQ-2026-001-customer360");
  });

  it("redacts tokens and raw PII before logs or results are scanned", () => {
    const redacted = redactWorkerEvidence(
      "GITHUB_PAT_TOKEN=token-build-worker-test Bearer token-session-test Avery Morgan avery.customer@example.test +1 555-010-1222"
    );

    expect(redacted).not.toContain("token-build-worker-test");
    expect(redacted).not.toContain("avery.customer@example.test");
    expect(scanWorkerEvidence([redacted])).toEqual([]);
  });

  it("allows one bounded repair attempt and redacts the failed transcript", async () => {
    const run = await runWithBoundedRepair(
      async (attempt) =>
        attempt === 0
          ? {
              exitCode: 1,
              stdout: "failed for Avery Morgan",
              stderr: "Bearer token-session-test leaked by failed runner"
            }
          : {
              exitCode: 0,
              stdout: "repair completed with masked Customer360 output",
              stderr: ""
            },
      1
    );

    expect(run).toMatchObject({
      finalStatus: "completed",
      attempts: 2,
      repaired: true
    });
    expect(scanWorkerEvidence(run.transcript)).toEqual([]);
  });

  it("stops after the configured repair limit", async () => {
    const run = await runWithBoundedRepair(
      async () => ({
        exitCode: 1,
        stdout: "still failing",
        stderr: "token-build-worker-test"
      }),
      1
    );

    expect(run.finalStatus).toBe("failed");
    expect(run.attempts).toBe(2);
    expect(scanWorkerEvidence(run.transcript)).toEqual([]);
  });
});
