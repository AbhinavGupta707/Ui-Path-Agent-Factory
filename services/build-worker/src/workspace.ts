import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { NormalizedBuildManifest } from "./manifest.js";

export interface WorkspacePlan {
  buildRunId: string;
  requestId: string;
  runRoot: string;
  workspaceRoot: string;
  logsRoot: string;
  manifestPath: string;
  agentInstructionsPath: string;
  outputAppPath: string;
  relativeOutputApp: string;
  templateId: string;
  allowedFilePatterns: string[];
}

export interface WorkspacePlanInput {
  buildRunId: string;
  manifest: NormalizedBuildManifest;
  rootDir?: string;
}

export function createWorkspacePlan(input: WorkspacePlanInput): WorkspacePlan {
  const runRoot = path.resolve(
    input.rootDir ?? process.env.BUILD_WORKER_RUN_ROOT ?? path.join(tmpdir(), "agent-factory-build-worker"),
    "runs",
    safePathSegment(input.buildRunId)
  );
  const workspaceRoot = path.join(runRoot, "workspace");
  const logsRoot = path.join(runRoot, "logs");
  const outputAppPath = path.resolve(workspaceRoot, input.manifest.outputApp);

  if (!isPathInside(workspaceRoot, outputAppPath)) {
    throw new Error(`Output app path escapes workspace: ${input.manifest.outputApp}`);
  }

  return {
    buildRunId: input.buildRunId,
    requestId: input.manifest.requestId,
    runRoot,
    workspaceRoot,
    logsRoot,
    manifestPath: path.join(workspaceRoot, "build_manifest.json"),
    agentInstructionsPath: path.join(workspaceRoot, "AGENTS.md"),
    outputAppPath,
    relativeOutputApp: input.manifest.outputApp,
    templateId: input.manifest.templateId,
    allowedFilePatterns: input.manifest.allowedFiles
  };
}

export async function prepareWorkspacePlan(plan: WorkspacePlan): Promise<WorkspacePlan> {
  await mkdir(plan.workspaceRoot, { recursive: true });
  await mkdir(plan.logsRoot, { recursive: true });
  await mkdir(plan.outputAppPath, { recursive: true });
  return plan;
}

export function isPathInside(parent: string, candidate: string): boolean {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function safePathSegment(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned || "build-run";
}
