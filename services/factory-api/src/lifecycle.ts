import { createHash } from "node:crypto";
import {
  ApprovalTaskSchema,
  BuildRunSchema,
  ClarificationQuestionSchema,
  CreateAutomationRequestSchema,
  FactoryBuildManifestSchema,
  GovernanceAssessmentSchema,
  StructuredSpecSchema,
  type ApprovalTask,
  type BuildRun,
  type ClarificationQuestion,
  type CreateAutomationRequest,
  type FactoryBuildManifest,
  type GovernanceAssessment,
  type IntakeRequest,
  type StructuredSpec
} from "@agent-factory/shared-contracts";
import type { FactoryRequestRecord } from "./store.js";

const defaultDataSources = [
  "synthetic_customers_csv",
  "synthetic_orders_csv",
  "synthetic_events_csv",
  "synthetic_returns_csv"
];

const defaultMetrics = [
  "revenue",
  "average_order_value",
  "repeat_purchase_rate",
  "purchase_frequency",
  "return_rate",
  "segment_revenue",
  "cohort_retention",
  "churn_risk_proxy"
];

const defaultFilters = ["date_range", "channel", "product_category", "segment"];

const manifestAllowedFiles = [
  "src/**",
  "tests/**",
  "public/data/**",
  "README.md",
  "deployment.json",
  "package.json"
];

const forbiddenActions = [
  "production_deploy",
  "external_network_without_approval",
  "secret_access",
  "delete_existing_files",
  "log_raw_pii"
];

const outputTargets = [
  "dashboard_app",
  "data_transform",
  "metric_tests",
  "readme",
  "deployment_manifest"
];

export function mapLegacyIntakeToCreateRequest(intake: IntakeRequest): CreateAutomationRequest {
  return CreateAutomationRequestSchema.parse({
    requester_name: intake.title,
    requester_email: intake.requesterEmail,
    request_text: intake.businessGoal,
    owner_name: intake.targetAudience,
    source_systems: intake.sourceSystems.length > 0 ? intake.sourceSystems : defaultDataSources,
    constraints: intake.constraints
  });
}

export function generateClarificationQuestions(record: FactoryRequestRecord): ClarificationQuestion[] {
  return [
    {
      id: "pii_policy",
      question: "Should generated Customer360 views mask customer names, emails, and phone numbers?",
      default: "Mask names/emails/phones",
      required: true
    },
    {
      id: "approved_sources",
      question: "Confirm the approved data sources for this build.",
      default: formatList(record.intake.source_systems.length > 0 ? record.intake.source_systems : defaultDataSources),
      required: true
    },
    {
      id: "approved_metrics",
      question: "Confirm the Customer360 metrics that must be included.",
      default: formatList(record.intake.requested_metrics.length > 0 ? record.intake.requested_metrics : defaultMetrics),
      required: true
    },
    {
      id: "required_filters",
      question: "Confirm the dashboard filters that must be available.",
      default: formatList(defaultFilters),
      required: true
    },
    {
      id: "approval_owner",
      question: "Who owns scope and release approval for this request?",
      default: record.request.owner_name,
      required: true
    }
  ].map((question) => ClarificationQuestionSchema.parse(question));
}

export function generateStructuredSpec(record: FactoryRequestRecord, now: string): StructuredSpec {
  const questions =
    record.clarificationQuestions.length > 0 ? record.clarificationQuestions : generateClarificationQuestions(record);
  const answers = record.clarificationAnswers;
  const createdAt = record.structuredSpec?.created_at ?? now;

  return StructuredSpecSchema.parse({
    spec_id: `SPEC-${record.request.request_id}`,
    request_id: record.request.request_id,
    business_goal: record.request.request_text,
    data_sources_json: listAnswer(record, "approved_sources", record.intake.source_systems),
    metrics_json: listAnswer(record, "approved_metrics", record.intake.requested_metrics),
    filters_json: listAnswer(record, "required_filters", defaultFilters),
    output_type: record.request.requested_artifact_type,
    owner: {
      name: answerValue(record, "approval_owner", record.request.owner_name),
      email: record.request.owner_email
    },
    constraints_json: [
      ...record.intake.constraints,
      `pii_policy:${answerValue(record, "pii_policy", "Mask names/emails/phones")}`,
      "sandbox_only:true",
      "uipath_orchestration:maestro_action_center_data_service_ready"
    ],
    clarification_questions_json: questions,
    clarification_answers_json: answers,
    platformMode: "local-simulated",
    created_at: createdAt,
    updated_at: now
  });
}

export function generateGovernanceAssessment(
  record: FactoryRequestRecord,
  spec: StructuredSpec,
  now: string
): { assessment: GovernanceAssessment; approvalTasks: ApprovalTask[] } {
  const normalized = [
    spec.business_goal,
    ...spec.data_sources_json,
    ...spec.metrics_json,
    ...spec.constraints_json
  ]
    .join(" ")
    .toLowerCase();
  const piiDetected = /customer360|customers?|crm|email|phone|name|pii|contact/.test(normalized);
  const productionIntent = /\b(production|external network|secret|raw pii|unmasked)\b/.test(normalized);
  const riskTier = productionIntent ? "high" : piiDetected ? "medium" : "low";
  const policyViolations = productionIntent
    ? ["Production deployment, secret access, or raw PII use requires a later live-platform approval path."]
    : [];

  const assessment = GovernanceAssessmentSchema.parse({
    assessment_id: `GOV-${record.request.request_id}`,
    request_id: record.request.request_id,
    risk_tier: riskTier,
    pii_detected: piiDetected,
    pii_policy: piiDetected ? "mask_email_name_phone" : "no_direct_pii_detected",
    forbidden_actions_json: forbiddenActions,
    required_approvals_json: ["scope_data_approval", "release_approval"],
    policy_decisions_json: [
      "Use customer360_dashboard_v1 only.",
      "Keep generated app sandbox-only until release approval.",
      "Use synthetic/local Customer360 data sources in Checkpoint 1.",
      piiDetected ? "Mask customer names, emails, and phone numbers." : "Continue PII scan before release."
    ],
    policy_violations_json: policyViolations,
    platformMode: "local-simulated",
    created_at: now
  });

  const approvalTasks = [
    ApprovalTaskSchema.parse({
      task_id: `TASK-${record.request.request_id}-SCOPE`,
      request_id: record.request.request_id,
      approval_type: "scope_data_approval",
      approver_role: "Data Owner",
      approver_name: record.request.owner_name,
      approver_email: record.request.owner_email,
      status: "pending",
      platformMode: "local-simulated",
      created_at: now
    })
  ];

  return { assessment, approvalTasks };
}

export function approveScopeTask(record: FactoryRequestRecord, now: string, comments?: string): ApprovalTask {
  const existingTask = record.approvalTasks.find((task) => task.approval_type === "scope_data_approval");

  return ApprovalTaskSchema.parse({
    ...(existingTask ?? {
      task_id: `TASK-${record.request.request_id}-SCOPE`,
      request_id: record.request.request_id,
      approval_type: "scope_data_approval",
      approver_role: "Data Owner",
      created_at: now
    }),
    approver_name: existingTask?.approver_name ?? record.request.owner_name,
    approver_email: existingTask?.approver_email ?? record.request.owner_email,
    status: "approved",
    comments: comments ?? "Approved for sandbox build.",
    platformMode: "local-simulated",
    completed_at: now
  });
}

export function generateBuildManifest(
  record: FactoryRequestRecord,
  spec: StructuredSpec,
  governance: GovernanceAssessment,
  now: string
): FactoryBuildManifest {
  const manifestCore = {
    request_id: record.request.request_id,
    template_id: record.request.template_id,
    artifact_type: "dashboard_app",
    allowed_files_json: manifestAllowedFiles,
    approved_data_sources_json: spec.data_sources_json,
    approved_metrics_json: spec.metrics_json,
    required_filters_json: spec.filters_json,
    pii_policy: governance.pii_policy,
    forbidden_actions_json: governance.forbidden_actions_json,
    output_targets_json: outputTargets,
    max_repair_attempts: 1,
    sandbox_only: true,
    platformMode: "local-simulated"
  };
  const manifestHash = createHash("sha256").update(JSON.stringify(manifestCore)).digest("hex");

  return FactoryBuildManifestSchema.parse({
    manifest_id: `MAN-${record.request.request_id}`,
    manifest_hash: manifestHash,
    created_at: now,
    ...manifestCore
  });
}

export function createQueuedBuildRun(record: FactoryRequestRecord, now: string): BuildRun {
  const nextRunNumber = record.buildRuns.length + 1;

  return BuildRunSchema.parse({
    build_run_id: `BUILD-${record.request.request_id}-${String(nextRunNumber).padStart(3, "0")}`,
    request_id: record.request.request_id,
    manifest_id: record.buildManifest?.manifest_id,
    status: "build_queued",
    mode: "sandbox",
    branch_name: `codex/${record.request.request_id.toLowerCase()}`,
    generated_files_json: [],
    platformMode: "local-simulated",
    updated_at: now
  });
}

function answerValue(record: FactoryRequestRecord, questionId: string, fallback: string): string {
  return record.clarificationAnswers.find((answer) => answer.question_id === questionId)?.answer ?? fallback;
}

function listAnswer(record: FactoryRequestRecord, questionId: string, fallback: string[]): string[] {
  const answer = record.clarificationAnswers.find((candidate) => candidate.question_id === questionId)?.answer;
  const values = (answer ? answer.split(",") : fallback).map((value) => value.trim()).filter(Boolean);
  return values.length > 0 ? values : fallback;
}

function formatList(values: string[]): string {
  return values.join(", ");
}
