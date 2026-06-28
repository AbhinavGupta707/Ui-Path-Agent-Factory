import { describe, expect, it } from "vitest";
import { createBuildPlan, createCodexExecArgs } from "../src/index.js";

describe("build worker contract", () => {
  it("creates Codex exec args with the expected sandbox", () => {
    expect(createCodexExecArgs("Reply ready.", { sandbox: "read-only" })).toEqual([
      "exec",
      "--sandbox",
      "read-only",
      "-m",
      "gpt-5.5",
      "--skip-git-repo-check",
      "Reply ready."
    ]);
  });

  it("creates a build plan from a manifest", () => {
    const plan = createBuildPlan({
      requestId: "req_1",
      template: "customer360-dashboard",
      branchName: "factory/req-1",
      outputApp: "apps/customer360-template",
      acceptanceCriteria: ["Dashboard builds", "Risk accounts are visible"],
      permissions: [],
      codexModel: "gpt-5.5"
    });

    expect(plan.branchName).toBe("factory/req-1");
    expect(plan.codexArgs).toContain("workspace-write");
    expect(plan.summary).toContain("apps/customer360-template");
  });
});
