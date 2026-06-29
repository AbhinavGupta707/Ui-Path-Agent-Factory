import { describe, expect, it } from "vitest";

type RunStatus =
  | "build_queued"
  | "building"
  | "tests_running"
  | "artifacts_captured"
  | "awaiting_release_approval"
  | "build_failed"
  | "tests_failed";

interface WorkerEvent {
  status: RunStatus;
  summary: string;
}

interface RunnerResult {
  ok: boolean;
  logs: string[];
  generatedFiles: string[];
  failureReason?: string;
}

interface TestResult {
  ok: boolean;
  report: string;
}

interface GitEvidence {
  mode: "local-diff" | "github-pr";
  branchName: string;
  prUrl?: string;
  summary: string;
}

interface FakeBuildResult {
  status: RunStatus;
  events: WorkerEvent[];
  logs: string[];
  generatedFiles: string[];
  testReport?: string;
  gitEvidence?: GitEvidence;
  failureReason?: string;
}

const unsafeEvidencePatterns = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g,
  /\b(Avery Morgan|Jordan Lee)\b/g,
  /GITHUB_PAT_TOKEN\s*=\s*[\w.-]+/gi,
  /Bearer\s+[\w.-]+/gi,
  /token-[\w.-]+/gi
];

function redact(value: string): string {
  return unsafeEvidencePatterns.reduce((safeValue, pattern) => safeValue.replace(pattern, "[REDACTED]"), value);
}

function scanEvidence(values: Array<string | undefined>): string[] {
  const text = values.filter(Boolean).join("\n");
  const issues: string[] = [];

  for (const pattern of unsafeEvidencePatterns) {
    if (pattern.test(text)) {
      issues.push(pattern.source);
    }
    pattern.lastIndex = 0;
  }

  return issues;
}

function createGitEvidence(branchName: string, githubToken?: string): GitEvidence {
  if (!githubToken) {
    return {
      mode: "local-diff",
      branchName,
      summary: "No GitHub token configured; returning local branch and diff evidence for UiPath review."
    };
  }

  return {
    mode: "github-pr",
    branchName,
    prUrl: "https://github.example.invalid/agent-factory/pull/123",
    summary: "GitHub token present; PR creation can be attempted by the live artifact lane."
  };
}

async function runFakeBuild(input: {
  githubToken?: string;
  branchName: string;
  runner: () => Promise<RunnerResult>;
  testRunner: () => Promise<TestResult>;
}): Promise<FakeBuildResult> {
  const events: WorkerEvent[] = [
    { status: "build_queued", summary: "Build accepted from approved manifest." },
    { status: "building", summary: "Codex runner started in injected fake mode." }
  ];

  const runnerResult = await input.runner();
  const logs = runnerResult.logs.map(redact);

  if (!runnerResult.ok) {
    events.push({ status: "build_failed", summary: "Codex runner failed before tests." });
    return {
      status: "build_failed",
      events,
      logs,
      generatedFiles: [],
      failureReason: redact(runnerResult.failureReason ?? "Codex runner failed")
    };
  }

  events.push({ status: "tests_running", summary: "Local checks started." });
  const testResult = await input.testRunner();

  if (!testResult.ok) {
    events.push({ status: "tests_failed", summary: "Local checks failed." });
    return {
      status: "tests_failed",
      events,
      logs,
      generatedFiles: runnerResult.generatedFiles,
      testReport: redact(testResult.report),
      failureReason: redact(testResult.report)
    };
  }

  events.push({ status: "artifacts_captured", summary: "Generated files and checks recorded." });
  events.push({ status: "awaiting_release_approval", summary: "Quality gate passed; release approval required." });

  return {
    status: "awaiting_release_approval",
    events,
    logs,
    generatedFiles: runnerResult.generatedFiles,
    testReport: redact(testResult.report),
    gitEvidence: createGitEvidence(input.branchName, input.githubToken)
  };
}

describe("build-worker run lifecycle with injected fakes", () => {
  it("records queued, build, test, artifact, and approval statuses without live GitHub", async () => {
    const result = await runFakeBuild({
      branchName: "factory/REQ-2026-001-customer360",
      runner: async () => ({
        ok: true,
        logs: ["Codex generated masked Customer360 dashboard files."],
        generatedFiles: ["src/main.tsx", "tests/dashboard.test.tsx", "README.md", "deployment.json"]
      }),
      testRunner: async () => ({
        ok: true,
        report: "metric tests passed; PII scan passed; smoke test passed"
      })
    });

    expect(result.events.map((event) => event.status)).toEqual([
      "build_queued",
      "building",
      "tests_running",
      "artifacts_captured",
      "awaiting_release_approval"
    ]);
    expect(result.gitEvidence).toEqual({
      mode: "local-diff",
      branchName: "factory/REQ-2026-001-customer360",
      summary: "No GitHub token configured; returning local branch and diff evidence for UiPath review."
    });
    expect(result.gitEvidence?.prUrl).toBeUndefined();
    expect(scanEvidence([...result.logs, result.testReport, result.gitEvidence?.summary])).toEqual([]);
  });

  it("keeps raw PII and token-shaped strings out of failed build evidence", async () => {
    const result = await runFakeBuild({
      branchName: "factory/REQ-2026-001-customer360",
      runner: async () => ({
        ok: false,
        logs: ["Build failed for Avery Morgan with GITHUB_PAT_TOKEN=token-build-worker-test"],
        generatedFiles: [],
        failureReason: "Avery Morgan avery.customer@example.test +1 555-010-1222 Bearer token-session-test"
      }),
      testRunner: async () => ({
        ok: true,
        report: "not reached"
      })
    });

    expect(result.status).toBe("build_failed");
    expect(result.events.map((event) => event.status)).toEqual(["build_queued", "building", "build_failed"]);
    expect(scanEvidence([...result.logs, result.failureReason])).toEqual([]);
  });

  it("reports test failure after build output capture without claiming release readiness", async () => {
    const result = await runFakeBuild({
      branchName: "factory/REQ-2026-001-customer360",
      runner: async () => ({
        ok: true,
        logs: ["Codex completed with masked output."],
        generatedFiles: ["src/main.tsx", "tests/dashboard.test.tsx"]
      }),
      testRunner: async () => ({
        ok: false,
        report: "metric test failed for masked Customer360 aggregate"
      })
    });

    expect(result.status).toBe("tests_failed");
    expect(result.events.map((event) => event.status)).toEqual([
      "build_queued",
      "building",
      "tests_running",
      "tests_failed"
    ]);
    expect(result.gitEvidence).toBeUndefined();
    expect(result.testReport).toBe("metric test failed for masked Customer360 aggregate");
  });
});
