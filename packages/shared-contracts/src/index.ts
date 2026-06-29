import { z } from "zod";

export const platformModes = ["local-simulated", "uipath-ready", "uipath-live"] as const;

export const automationRequestStatuses = [
  "draft",
  "clarifying",
  "awaiting_scope_approval",
  "approved_for_build",
  "manifest_created",
  "build_queued",
  "building",
  "build_failed",
  "tests_running",
  "tests_failed",
  "awaiting_release_approval",
  "deploying",
  "deployed",
  "blocked",
  "cancelled"
] as const;

export const riskTiers = ["low", "medium", "high"] as const;

export const approvalStatuses = ["pending", "approved", "changes_requested", "rejected"] as const;

export const buildRunStatuses = [
  "build_queued",
  "building",
  "build_failed",
  "tests_running",
  "tests_failed",
  "awaiting_release_approval",
  "deploying",
  "deployed",
  "blocked",
  "cancelled"
] as const;

export const agentModelProfiles = ["fast", "reasoning", "code", "fallback"] as const;

export const agentRuntimeModes = [
  "live",
  "deterministic-fallback",
  "degraded-no-key",
  "degraded-provider-error"
] as const;

export const agentStepIds = [
  "intake_classification",
  "requirements_spec_generation",
  "governance_assessment",
  "build_plan"
] as const;

export const UiPathContextSchema = z.object({
  baseUrl: z.string().url(),
  organization: z.string().min(1),
  tenant: z.string().min(1),
  folderName: z.string().min(1),
  folderKey: z.string().optional(),
  folderId: z.string().optional()
});

export const RequestPrioritySchema = z.enum(["low", "normal", "high", "urgent"]);

export const PlatformModeSchema = z.enum(platformModes);

export const AutomationRequestStatusSchema = z.enum(automationRequestStatuses);

export const CreateAutomationRequestSchema = z.object({
  requester_name: z.string().min(1),
  requester_email: z.string().email(),
  request_text: z.string().min(12),
  requested_artifact_type: z.string().min(1).default("dashboard_app"),
  template_id: z.literal("customer360_dashboard_v1").default("customer360_dashboard_v1"),
  priority: RequestPrioritySchema.default("normal"),
  owner_name: z.string().min(1).default("Revenue Ops"),
  owner_email: z.string().email().optional(),
  source_systems: z.array(z.string().min(1)).default([
    "synthetic_customers_csv",
    "synthetic_orders_csv",
    "synthetic_events_csv",
    "synthetic_returns_csv"
  ]),
  requested_metrics: z.array(z.string().min(1)).default([
    "revenue",
    "average_order_value",
    "repeat_purchase_rate",
    "purchase_frequency",
    "return_rate",
    "segment_revenue",
    "cohort_retention",
    "churn_risk_proxy"
  ]),
  constraints: z.array(z.string().min(1)).default([])
});

export const IntakeRequestSchema = z.object({
  title: z.string().min(4),
  requesterEmail: z.string().email(),
  businessGoal: z.string().min(12),
  targetAudience: z.string().min(2),
  dueDate: z.string().optional(),
  sourceSystems: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([])
});

export const ClarificationQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  default: z.string().min(1),
  required: z.boolean().default(true),
  source: z.string().min(1).default("UiPath Clarification Agent (local-simulated)")
});

export const ClarificationAnswerSchema = z.object({
  question_id: z.string().min(1),
  answer: z.string().min(1),
  answered_by: z.string().min(1).default("business-user"),
  answered_at: z.string().datetime().optional()
});

export const ClarificationAnswersRequestSchema = z.object({
  answers: z.array(ClarificationAnswerSchema).min(1)
});

export const StructuredSpecSchema = z.object({
  spec_id: z.string().min(1),
  request_id: z.string().min(1),
  business_goal: z.string().min(12),
  data_sources_json: z.array(z.string().min(1)),
  metrics_json: z.array(z.string().min(1)),
  filters_json: z.array(z.string().min(1)),
  output_type: z.string().min(1),
  owner: z.object({
    name: z.string().min(1),
    email: z.string().email().optional()
  }),
  constraints_json: z.array(z.string().min(1)),
  clarification_questions_json: z.array(ClarificationQuestionSchema),
  clarification_answers_json: z.array(ClarificationAnswerSchema),
  platformMode: PlatformModeSchema.default("local-simulated"),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export const GovernanceAssessmentSchema = z.object({
  assessment_id: z.string().min(1),
  request_id: z.string().min(1),
  risk_tier: z.enum(riskTiers),
  pii_detected: z.boolean(),
  pii_policy: z.string().min(1),
  forbidden_actions_json: z.array(z.string().min(1)),
  required_approvals_json: z.array(z.string().min(1)),
  policy_decisions_json: z.array(z.string().min(1)),
  policy_violations_json: z.array(z.string().min(1)).default([]),
  platformMode: PlatformModeSchema.default("local-simulated"),
  created_at: z.string().datetime()
});

export const ApprovalTaskSchema = z.object({
  task_id: z.string().min(1),
  request_id: z.string().min(1),
  approval_type: z.string().min(1),
  approver_role: z.string().min(1),
  approver_name: z.string().min(1).optional(),
  approver_email: z.string().email().optional(),
  status: z.enum(approvalStatuses),
  comments: z.string().optional(),
  platformMode: PlatformModeSchema.default("local-simulated"),
  created_at: z.string().datetime(),
  completed_at: z.string().datetime().optional()
});

export const FactoryBuildManifestSchema = z.object({
  manifest_id: z.string().min(1),
  request_id: z.string().min(1),
  manifest_hash: z.string().min(16),
  template_id: z.literal("customer360_dashboard_v1"),
  artifact_type: z.literal("dashboard_app"),
  allowed_files_json: z.array(z.string().min(1)),
  approved_data_sources_json: z.array(z.string().min(1)),
  approved_metrics_json: z.array(z.string().min(1)),
  required_filters_json: z.array(z.string().min(1)),
  pii_policy: z.string().min(1),
  forbidden_actions_json: z.array(z.string().min(1)),
  output_targets_json: z.array(z.string().min(1)),
  max_repair_attempts: z.number().int().min(0).max(3),
  sandbox_only: z.boolean(),
  platformMode: PlatformModeSchema.default("local-simulated"),
  created_at: z.string().datetime()
});

export const BuildRunSchema = z.object({
  build_run_id: z.string().min(1),
  request_id: z.string().min(1),
  manifest_id: z.string().min(1),
  status: z.enum(buildRunStatuses),
  mode: z.enum(["sandbox"]).default("sandbox"),
  worker_id: z.string().optional(),
  codex_session_id: z.string().optional(),
  branch_name: z.string().optional(),
  commit_sha: z.string().optional(),
  pr_url: z.string().url().optional(),
  generated_files_json: z.array(z.string()).default([]),
  logs_uri: z.string().optional(),
  platformMode: PlatformModeSchema.default("local-simulated"),
  started_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  updated_at: z.string().datetime()
});

export const BuildStatusUpdateSchema = z.object({
  status: z.enum(buildRunStatuses),
  worker_id: z.string().optional(),
  codex_session_id: z.string().optional(),
  branch_name: z.string().optional(),
  commit_sha: z.string().optional(),
  pr_url: z.string().url().optional(),
  generated_files_json: z.array(z.string()).optional(),
  logs_uri: z.string().optional()
});

export const AgentModelProfileSchema = z.enum(agentModelProfiles);

export const AgentRuntimeModeSchema = z.enum(agentRuntimeModes);

export const AgentStepIdSchema = z.enum(agentStepIds);

export const AgentTokenUsageSchema = z.object({
  prompt_tokens: z.number().int().nonnegative().optional(),
  completion_tokens: z.number().int().nonnegative().optional(),
  total_tokens: z.number().int().nonnegative().optional()
});

export const LangSmithTraceMetadataSchema = z.object({
  enabled: z.boolean(),
  project: z.string().min(1).optional(),
  run_name: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
  metadata: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).default({})
});

export const AgentStepTraceEnvelopeSchema = z.object({
  trace_id: z.string().min(1),
  request_id: z.string().min(1).optional(),
  step_id: AgentStepIdSchema,
  provider: z.literal("fireworks"),
  profile: AgentModelProfileSchema,
  model_id: z.string().min(1),
  mode: AgentRuntimeModeSchema,
  langsmith: LangSmithTraceMetadataSchema,
  redaction: z.object({
    pii_redacted: z.boolean(),
    secrets_redacted: z.boolean(),
    raw_prompt_stored: z.literal(false),
    raw_response_stored: z.literal(false)
  }),
  usage: AgentTokenUsageSchema.optional(),
  started_at: z.string().datetime(),
  completed_at: z.string().datetime().optional(),
  latency_ms: z.number().nonnegative().optional(),
  warnings: z.array(z.string().min(1)).default([])
});

export const IntakeClassificationOutputSchema = z.object({
  output_id: z.string().min(1),
  request_id: z.string().min(1),
  artifact_type: z.literal("dashboard_app"),
  template_id: z.literal("customer360_dashboard_v1"),
  complexity: z.enum(["low", "medium", "high"]),
  confidence: z.number().min(0).max(1),
  pii_likelihood: z.enum(["none", "possible", "likely"]),
  missing_information: z.array(z.string().min(1)),
  inferred_source_systems: z.array(z.string().min(1)),
  inferred_metrics: z.array(z.string().min(1)),
  summary: z.string().min(1),
  trace: AgentStepTraceEnvelopeSchema
});

export const RequirementsSpecGenerationOutputSchema = z.object({
  output_id: z.string().min(1),
  request_id: z.string().min(1),
  spec: StructuredSpecSchema,
  assumptions: z.array(z.string().min(1)).default([]),
  trace: AgentStepTraceEnvelopeSchema
});

export const GovernanceAgentOutputSchema = z.object({
  output_id: z.string().min(1),
  request_id: z.string().min(1),
  assessment: GovernanceAssessmentSchema,
  approval_tasks: z.array(ApprovalTaskSchema),
  trace: AgentStepTraceEnvelopeSchema
});

export const BuildPlanAgentOutputSchema = z.object({
  output_id: z.string().min(1),
  request_id: z.string().min(1),
  manifest: FactoryBuildManifestSchema,
  worker_instructions: z.array(z.string().min(1)),
  acceptance_criteria: z.array(z.string().min(1)),
  trace: AgentStepTraceEnvelopeSchema
});

export const AuditEventSchema = z.object({
  event_id: z.string().min(1),
  request_id: z.string().min(1),
  actor_type: z.enum(["user", "factory-api", "uipath-maestro", "uipath-agent", "action-center", "codex-worker"]),
  actor_name: z.string().min(1),
  action: z.string().min(1),
  summary: z.string().min(1),
  payload_json: z.record(z.unknown()).default({}),
  timestamp: z.string().datetime()
});

export const AutomationRequestSchema = z.object({
  request_id: z.string().min(1),
  requester_name: z.string().min(1),
  requester_email: z.string().email(),
  request_text: z.string().min(12),
  requested_artifact_type: z.string().min(1),
  template_id: z.literal("customer360_dashboard_v1"),
  status: AutomationRequestStatusSchema,
  priority: RequestPrioritySchema,
  owner_name: z.string().min(1),
  owner_email: z.string().email().optional(),
  platformMode: PlatformModeSchema.default("local-simulated"),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export const AutomationRequestDetailSchema = z.object({
  request: AutomationRequestSchema,
  clarificationQuestions: z.array(ClarificationQuestionSchema),
  clarificationAnswers: z.array(ClarificationAnswerSchema),
  structuredSpec: StructuredSpecSchema.optional(),
  governanceAssessment: GovernanceAssessmentSchema.optional(),
  approvalTasks: z.array(ApprovalTaskSchema),
  buildManifest: FactoryBuildManifestSchema.optional(),
  buildRuns: z.array(BuildRunSchema),
  auditEvents: z.array(AuditEventSchema)
});

// Existing worker-facing manifest contract retained for Checkpoint 0/3 build-worker compatibility.
export const BuildManifestSchema = z.object({
  requestId: z.string().min(1),
  template: z.literal("customer360-dashboard"),
  branchName: z.string().min(1),
  outputApp: z.string().min(1),
  acceptanceCriteria: z.array(z.string()).min(1),
  permissions: z.array(z.string()).default([]),
  codexModel: z.string().default("gpt-5.5")
});

export type PlatformMode = (typeof platformModes)[number];
export type UiPathContext = z.infer<typeof UiPathContextSchema>;
export type CreateAutomationRequest = z.infer<typeof CreateAutomationRequestSchema>;
export type IntakeRequest = z.infer<typeof IntakeRequestSchema>;
export type ClarificationQuestion = z.infer<typeof ClarificationQuestionSchema>;
export type ClarificationAnswer = z.infer<typeof ClarificationAnswerSchema>;
export type StructuredSpec = z.infer<typeof StructuredSpecSchema>;
export type GovernanceAssessment = z.infer<typeof GovernanceAssessmentSchema>;
export type ApprovalTask = z.infer<typeof ApprovalTaskSchema>;
export type FactoryBuildManifest = z.infer<typeof FactoryBuildManifestSchema>;
export type BuildManifest = z.infer<typeof BuildManifestSchema>;
export type BuildRun = z.infer<typeof BuildRunSchema>;
export type BuildStatusUpdate = z.infer<typeof BuildStatusUpdateSchema>;
export type AgentModelProfile = z.infer<typeof AgentModelProfileSchema>;
export type AgentRuntimeMode = z.infer<typeof AgentRuntimeModeSchema>;
export type AgentStepId = z.infer<typeof AgentStepIdSchema>;
export type AgentTokenUsage = z.infer<typeof AgentTokenUsageSchema>;
export type AgentStepTraceEnvelope = z.infer<typeof AgentStepTraceEnvelopeSchema>;
export type IntakeClassificationOutput = z.infer<typeof IntakeClassificationOutputSchema>;
export type RequirementsSpecGenerationOutput = z.infer<typeof RequirementsSpecGenerationOutputSchema>;
export type GovernanceAgentOutput = z.infer<typeof GovernanceAgentOutputSchema>;
export type BuildPlanAgentOutput = z.infer<typeof BuildPlanAgentOutputSchema>;
export type AuditEvent = z.infer<typeof AuditEventSchema>;
export type AutomationRequestStatus = (typeof automationRequestStatuses)[number];
export type AutomationRequest = z.infer<typeof AutomationRequestSchema>;
export type AutomationRequestDetail = z.infer<typeof AutomationRequestDetailSchema>;

export const defaultUiPathContext: UiPathContext = {
  baseUrl: "https://cloud.uipath.com",
  organization: "galacticus",
  tenant: "DefaultTenant",
  folderName: "AgentFactoryDemo",
  folderKey: "cba41e19-47cc-4a0a-bf73-de88b60a61be",
  folderId: "7986306"
};

export function createAuditEvent(
  input: Omit<AuditEvent, "event_id" | "timestamp"> & Partial<Pick<AuditEvent, "event_id" | "timestamp">>
): AuditEvent {
  return AuditEventSchema.parse({
    ...input,
    event_id: input.event_id ?? `AUD-${Date.now()}`,
    timestamp: input.timestamp ?? new Date().toISOString()
  });
}
