import type { NormalizedBuildManifest, WorkerPlatformMode } from "./manifest.js";
import type { WorkspacePlan } from "./workspace.js";

export const buildWorkerRunStatuses = [
  "build_queued",
  "building",
  "tests_running",
  "artifact_capture",
  "awaiting_release_approval",
  "build_failed",
  "tests_failed",
  "blocked",
  "cancelled"
] as const;

export type BuildWorkerRunStatus = (typeof buildWorkerRunStatuses)[number];
export type BuildCheckStatus = "passed" | "failed" | "skipped";

export interface BuildCheckResult {
  name: string;
  status: BuildCheckStatus;
  summary?: string;
  report_uri?: string;
  started_at?: string;
  completed_at?: string;
}

export interface BuildArtifact {
  name: string;
  type: "log" | "diff" | "test_report" | "generated_file" | "workspace" | "other";
  path?: string;
  uri?: string;
  summary?: string;
}

export interface BuildRunEvent {
  event_id: string;
  build_run_id: string;
  request_id: string;
  status: BuildWorkerRunStatus;
  action: string;
  actor: string;
  summary: string;
  payload_json: Record<string, unknown>;
  timestamp: string;
}

export interface BuildWorkerRun {
  build_run_id: string;
  request_id: string;
  manifest_id: string;
  operation_id?: string;
  status: BuildWorkerRunStatus;
  mode: "sandbox";
  platformMode: WorkerPlatformMode;
  worker_id: string;
  manifest: NormalizedBuildManifest;
  workspace: WorkspacePlan;
  branch_name?: string;
  commit_sha?: string;
  pr_url?: string;
  codex_session_id?: string;
  logs_uri?: string;
  generated_files_json: string[];
  checks: BuildCheckResult[];
  artifacts: BuildArtifact[];
  failure_reason?: string;
  accepted_at: string;
  started_at?: string;
  completed_at?: string;
  updated_at: string;
  events: BuildRunEvent[];
}

export interface CreateBuildRunInput {
  buildRunId: string;
  operationId?: string;
  platformMode: WorkerPlatformMode;
  workerId: string;
  manifest: NormalizedBuildManifest;
  workspace: WorkspacePlan;
}

export interface BuildRunPatch {
  status?: BuildWorkerRunStatus;
  branch_name?: string;
  commit_sha?: string;
  pr_url?: string;
  codex_session_id?: string;
  logs_uri?: string;
  generated_files_json?: string[];
  checks?: BuildCheckResult[];
  artifacts?: BuildArtifact[];
  failure_reason?: string;
  started_at?: string;
  completed_at?: string;
}

export interface BuildRunEventInput {
  status?: BuildWorkerRunStatus;
  action: string;
  actor?: string;
  summary: string;
  payload_json?: Record<string, unknown>;
}

export interface BuildRunStore {
  now(): string;
  nextRunId(requestId: string): string;
  listRuns(): Promise<BuildWorkerRun[]>;
  getRun(buildRunId: string): Promise<BuildWorkerRun | undefined>;
  getRunByOperationId(operationId: string): Promise<BuildWorkerRun | undefined>;
  createRun(input: CreateBuildRunInput): Promise<BuildWorkerRun>;
  updateRun(buildRunId: string, patch: BuildRunPatch, event?: BuildRunEventInput): Promise<BuildWorkerRun>;
  addEvent(buildRunId: string, event: BuildRunEventInput): Promise<BuildWorkerRun>;
}

export interface InMemoryBuildRunStoreOptions {
  now?: () => string;
}

export function createInMemoryBuildRunStore(options: InMemoryBuildRunStoreOptions = {}): BuildRunStore {
  return new InMemoryBuildRunStore(options.now);
}

class InMemoryBuildRunStore implements BuildRunStore {
  private readonly runs = new Map<string, BuildWorkerRun>();
  private readonly operationIndex = new Map<string, string>();
  private runCounter = 0;
  private eventCounter = 0;

  constructor(private readonly nowSource: () => string = () => new Date().toISOString()) {}

  now(): string {
    return this.nowSource();
  }

  nextRunId(requestId: string): string {
    this.runCounter += 1;
    return `BUILD-${requestId}-${String(this.runCounter).padStart(3, "0")}`;
  }

  async listRuns(): Promise<BuildWorkerRun[]> {
    return [...this.runs.values()];
  }

  async getRun(buildRunId: string): Promise<BuildWorkerRun | undefined> {
    return this.runs.get(buildRunId);
  }

  async getRunByOperationId(operationId: string): Promise<BuildWorkerRun | undefined> {
    const buildRunId = this.operationIndex.get(operationId);
    return buildRunId ? this.getRun(buildRunId) : undefined;
  }

  async createRun(input: CreateBuildRunInput): Promise<BuildWorkerRun> {
    if (input.operationId) {
      const existing = await this.getRunByOperationId(input.operationId);

      if (existing) {
        return existing;
      }
    }

    const now = this.now();
    const run: BuildWorkerRun = {
      build_run_id: input.buildRunId,
      request_id: input.manifest.requestId,
      manifest_id: input.manifest.manifestId,
      operation_id: input.operationId,
      status: "build_queued",
      mode: "sandbox",
      platformMode: input.platformMode,
      worker_id: input.workerId,
      manifest: input.manifest,
      workspace: input.workspace,
      branch_name: input.manifest.branchName,
      generated_files_json: [],
      checks: [],
      artifacts: [],
      accepted_at: now,
      updated_at: now,
      events: []
    };

    const event = this.createEvent(run, {
      action: "build_queued",
      summary: `Queued build run ${input.buildRunId}.`,
      payload_json: {
        manifest_id: input.manifest.manifestId,
        template_id: input.manifest.templateId,
        workspace_root: input.workspace.workspaceRoot
      }
    });

    run.events = [event];
    this.runs.set(run.build_run_id, run);

    if (input.operationId) {
      this.operationIndex.set(input.operationId, run.build_run_id);
    }

    return run;
  }

  async updateRun(buildRunId: string, patch: BuildRunPatch, event?: BuildRunEventInput): Promise<BuildWorkerRun> {
    const current = this.requireRun(buildRunId);
    const updated: BuildWorkerRun = {
      ...current,
      ...patch,
      updated_at: this.now()
    };

    if (event) {
      updated.events = [
        ...current.events,
        this.createEvent(updated, {
          ...event,
          status: event.status ?? patch.status ?? updated.status
        })
      ];
    }

    this.runs.set(buildRunId, updated);
    return updated;
  }

  async addEvent(buildRunId: string, event: BuildRunEventInput): Promise<BuildWorkerRun> {
    const current = this.requireRun(buildRunId);
    const updated: BuildWorkerRun = {
      ...current,
      events: [...current.events, this.createEvent(current, event)],
      updated_at: this.now()
    };

    this.runs.set(buildRunId, updated);
    return updated;
  }

  private requireRun(buildRunId: string): BuildWorkerRun {
    const run = this.runs.get(buildRunId);

    if (!run) {
      throw new Error(`Build run not found: ${buildRunId}`);
    }

    return run;
  }

  private createEvent(run: BuildWorkerRun, input: BuildRunEventInput): BuildRunEvent {
    this.eventCounter += 1;

    return {
      event_id: `EVT-${String(this.eventCounter).padStart(4, "0")}`,
      build_run_id: run.build_run_id,
      request_id: run.request_id,
      status: input.status ?? run.status,
      action: input.action,
      actor: input.actor ?? run.worker_id,
      summary: input.summary,
      payload_json: input.payload_json ?? {},
      timestamp: this.now()
    };
  }
}
