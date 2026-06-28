import type {
  ApprovalTask,
  AuditEvent,
  AutomationRequest,
  AutomationRequestDetail,
  AutomationRequestStatus,
  BuildRun,
  ClarificationAnswer,
  ClarificationQuestion,
  CreateAutomationRequest,
  FactoryBuildManifest,
  GovernanceAssessment,
  StructuredSpec
} from "@agent-factory/shared-contracts";

export interface FactoryRequestRecord {
  request: AutomationRequest;
  intake: CreateAutomationRequest;
  clarificationQuestions: ClarificationQuestion[];
  clarificationAnswers: ClarificationAnswer[];
  structuredSpec?: StructuredSpec;
  governanceAssessment?: GovernanceAssessment;
  approvalTasks: ApprovalTask[];
  buildManifest?: FactoryBuildManifest;
  buildRuns: BuildRun[];
}

export interface FactoryStore {
  now(): string;
  nextAuditId(): string;
  listRequests(): Promise<AutomationRequest[]>;
  getRequestRecord(requestId: string): Promise<FactoryRequestRecord | undefined>;
  getRequestDetail(requestId: string): Promise<AutomationRequestDetail | undefined>;
  createRequest(input: CreateAutomationRequest): Promise<FactoryRequestRecord>;
  updateRequestStatus(requestId: string, status: AutomationRequestStatus): Promise<FactoryRequestRecord>;
  saveClarificationQuestions(
    requestId: string,
    questions: ClarificationQuestion[]
  ): Promise<FactoryRequestRecord>;
  saveClarificationAnswers(requestId: string, answers: ClarificationAnswer[]): Promise<FactoryRequestRecord>;
  saveStructuredSpec(requestId: string, spec: StructuredSpec): Promise<FactoryRequestRecord>;
  saveGovernanceAssessment(
    requestId: string,
    assessment: GovernanceAssessment,
    approvalTasks: ApprovalTask[]
  ): Promise<FactoryRequestRecord>;
  saveApprovalTask(requestId: string, task: ApprovalTask): Promise<FactoryRequestRecord>;
  saveBuildManifest(requestId: string, manifest: FactoryBuildManifest): Promise<FactoryRequestRecord>;
  createBuildRun(run: BuildRun): Promise<FactoryRequestRecord>;
  updateBuildRun(buildRunId: string, patch: Partial<BuildRun>): Promise<FactoryRequestRecord>;
  addAuditEvent(event: AuditEvent): Promise<AuditEvent>;
  listAuditEvents(requestId: string): Promise<AuditEvent[]>;
}

export interface InMemoryFactoryStoreOptions {
  now?: () => string;
}

export function createInMemoryFactoryStore(options: InMemoryFactoryStoreOptions = {}): FactoryStore {
  return new InMemoryFactoryStore(options.now);
}

class InMemoryFactoryStore implements FactoryStore {
  private readonly records = new Map<string, FactoryRequestRecord>();
  private readonly auditEvents: AuditEvent[] = [];
  private requestCounter = 0;
  private auditCounter = 0;
  private buildCounter = 0;

  constructor(private readonly nowSource: () => string = () => new Date().toISOString()) {}

  now(): string {
    return this.nowSource();
  }

  nextAuditId(): string {
    this.auditCounter += 1;
    return `AUD-${String(this.auditCounter).padStart(4, "0")}`;
  }

  async listRequests(): Promise<AutomationRequest[]> {
    return [...this.records.values()].map((record) => record.request);
  }

  async getRequestRecord(requestId: string): Promise<FactoryRequestRecord | undefined> {
    return this.records.get(requestId);
  }

  async getRequestDetail(requestId: string): Promise<AutomationRequestDetail | undefined> {
    const record = this.records.get(requestId);

    if (!record) {
      return undefined;
    }

    return {
      ...record,
      auditEvents: await this.listAuditEvents(requestId)
    };
  }

  async createRequest(input: CreateAutomationRequest): Promise<FactoryRequestRecord> {
    this.requestCounter += 1;
    const now = this.now();
    const year = new Date(now).getUTCFullYear();
    const requestId = `REQ-${year}-${String(this.requestCounter).padStart(3, "0")}`;
    const request: AutomationRequest = {
      request_id: requestId,
      requester_name: input.requester_name,
      requester_email: input.requester_email,
      request_text: input.request_text,
      requested_artifact_type: input.requested_artifact_type,
      template_id: input.template_id,
      status: "clarifying",
      priority: input.priority,
      owner_name: input.owner_name,
      owner_email: input.owner_email,
      platformMode: "local-simulated",
      created_at: now,
      updated_at: now
    };

    const record: FactoryRequestRecord = {
      request,
      intake: input,
      clarificationQuestions: [],
      clarificationAnswers: [],
      approvalTasks: [],
      buildRuns: []
    };

    this.records.set(requestId, record);
    return record;
  }

  async updateRequestStatus(requestId: string, status: AutomationRequestStatus): Promise<FactoryRequestRecord> {
    const record = this.requireRecord(requestId);
    record.request = {
      ...record.request,
      status,
      updated_at: this.now()
    };
    this.records.set(requestId, record);
    return record;
  }

  async saveClarificationQuestions(
    requestId: string,
    questions: ClarificationQuestion[]
  ): Promise<FactoryRequestRecord> {
    const record = this.requireRecord(requestId);
    record.clarificationQuestions = questions;
    record.request.updated_at = this.now();
    return record;
  }

  async saveClarificationAnswers(requestId: string, answers: ClarificationAnswer[]): Promise<FactoryRequestRecord> {
    const record = this.requireRecord(requestId);
    record.clarificationAnswers = answers;
    record.request.updated_at = this.now();
    return record;
  }

  async saveStructuredSpec(requestId: string, spec: StructuredSpec): Promise<FactoryRequestRecord> {
    const record = this.requireRecord(requestId);
    record.structuredSpec = spec;
    record.request.updated_at = this.now();
    return record;
  }

  async saveGovernanceAssessment(
    requestId: string,
    assessment: GovernanceAssessment,
    approvalTasks: ApprovalTask[]
  ): Promise<FactoryRequestRecord> {
    const record = this.requireRecord(requestId);
    record.governanceAssessment = assessment;
    record.approvalTasks = approvalTasks;
    record.request.updated_at = this.now();
    return record;
  }

  async saveApprovalTask(requestId: string, task: ApprovalTask): Promise<FactoryRequestRecord> {
    const record = this.requireRecord(requestId);
    record.approvalTasks = record.approvalTasks.map((existingTask) =>
      existingTask.task_id === task.task_id ? task : existingTask
    );
    record.request.updated_at = this.now();
    return record;
  }

  async saveBuildManifest(requestId: string, manifest: FactoryBuildManifest): Promise<FactoryRequestRecord> {
    const record = this.requireRecord(requestId);
    record.buildManifest = manifest;
    record.request.updated_at = this.now();
    return record;
  }

  async createBuildRun(run: BuildRun): Promise<FactoryRequestRecord> {
    const record = this.requireRecord(run.request_id);
    const buildRun = run.build_run_id.length > 0 ? run : { ...run, build_run_id: this.nextBuildRunId(run.request_id) };
    record.buildRuns = [...record.buildRuns, buildRun];
    record.request.updated_at = this.now();
    return record;
  }

  async updateBuildRun(buildRunId: string, patch: Partial<BuildRun>): Promise<FactoryRequestRecord> {
    for (const record of this.records.values()) {
      const buildRunIndex = record.buildRuns.findIndex((run) => run.build_run_id === buildRunId);

      if (buildRunIndex >= 0) {
        const currentRun = record.buildRuns[buildRunIndex];

        if (!currentRun) {
          throw new Error(`Build run not found: ${buildRunId}`);
        }

        record.buildRuns[buildRunIndex] = {
          ...currentRun,
          ...patch,
          updated_at: this.now()
        };
        record.request.updated_at = this.now();
        return record;
      }
    }

    throw new Error(`Build run not found: ${buildRunId}`);
  }

  async addAuditEvent(event: AuditEvent): Promise<AuditEvent> {
    this.auditEvents.push(event);
    return event;
  }

  async listAuditEvents(requestId: string): Promise<AuditEvent[]> {
    return this.auditEvents.filter((event) => event.request_id === requestId);
  }

  private nextBuildRunId(requestId: string): string {
    this.buildCounter += 1;
    return `BUILD-${requestId}-${String(this.buildCounter).padStart(3, "0")}`;
  }

  private requireRecord(requestId: string): FactoryRequestRecord {
    const record = this.records.get(requestId);

    if (!record) {
      throw new Error(`Request not found: ${requestId}`);
    }

    return record;
  }
}
