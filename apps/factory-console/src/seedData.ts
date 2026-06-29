import type {
  BuildManifest,
  IntakeRequest
} from "@agent-factory/shared-contracts";

export interface SourceSystem {
  id: string;
  label: string;
  owner: string;
  product: string;
  status: "approved" | "needs_mapping" | "read_only";
}

export interface MetricOption {
  id: string;
  label: string;
  guardrail: string;
}

export interface ClarificationQuestion {
  id: string;
  product: string;
  question: string;
  defaultAnswer: string;
}

export interface PolicyDecision {
  label: string;
  value: string;
  severity: "success" | "warning" | "danger" | "neutral";
}

export interface QualityGate {
  name: string;
  provider: string;
  status: "ready" | "queued" | "blocked" | "passed" | "live_catalog";
  detail: string;
  testCaseKey?: string;
  evidenceCommand?: string;
}

export interface LifecycleStep {
  id: string;
  label: string;
  product: string;
  status: "complete" | "active" | "waiting" | "queued" | "ready";
}

export interface ConsoleRequest {
  id: string;
  intake: IntakeRequest;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsoleStructuredSpec {
  requestId: string;
  objective: string;
  requiredCapabilities: string[];
  dataSources: string[];
  acceptanceCriteria: string[];
  governanceNotes: string[];
}

export interface ConsoleGovernanceAssessment {
  requestId: string;
  riskLevel: "low" | "medium" | "high";
  requiresHumanApproval: boolean;
  requiredPermissions: string[];
  blockers: string[];
}

export interface ConsoleAuditEvent {
  id: string;
  requestId: string;
  actor: string;
  action: string;
  summary: string;
  createdAt: string;
}

export interface PlatformEvidence {
  product: string;
  mode: "local-simulated" | "uipath-ready" | "uipath-live";
  status: "active" | "ready" | "pending" | "catalog-live";
  detail: string;
}

export interface BuildLogEvent {
  id: string;
  time: string;
  source: string;
  level: "info" | "success" | "warning";
  message: string;
}

export interface ReleaseApprovalEvidence {
  status: "pending" | "approved";
  approver: string;
  actionCenterMode: "uipath-ready";
  summary: string;
  payloadIncludes: string[];
}

export interface DeploymentEvidence {
  deploymentId: string;
  environment: string;
  status: "preview-deployed" | "pending-live-deploy";
  provider: string;
  url: string;
  rollbackRef: string;
  rollbackNotes: string;
  platformMode: "local-simulated" | "uipath-ready";
}

export interface TestManagerCatalog {
  projectName: string;
  projectKey: string;
  projectId: string;
  testSetName: string;
  testSetKey: string;
  testSetId: string;
  liveExecutionStatus: "not-run";
  note: string;
}

export const requestId = "req_customer360_checkpoint_1";
export const specId = "spec_customer360_checkpoint_1";
export const manifestId = "man_customer360_checkpoint_1";

export const sourceSystems: SourceSystem[] = [
  {
    id: "salesforce_crm",
    label: "Salesforce CRM",
    owner: "Revenue Ops",
    product: "Integration Service",
    status: "approved"
  },
  {
    id: "snowflake_mart",
    label: "Snowflake marts",
    owner: "Data Platform",
    product: "Data Service",
    status: "read_only"
  },
  {
    id: "stripe_billing",
    label: "Stripe billing",
    owner: "Finance Systems",
    product: "API Workflow",
    status: "approved"
  },
  {
    id: "zendesk_support",
    label: "Zendesk support",
    owner: "CX Ops",
    product: "Integration Service",
    status: "needs_mapping"
  },
  {
    id: "product_events",
    label: "Product events",
    owner: "Analytics Eng",
    product: "Data Service",
    status: "read_only"
  },
  {
    id: "marketo_campaigns",
    label: "Marketo campaigns",
    owner: "Growth Ops",
    product: "Orchestrator",
    status: "needs_mapping"
  }
];

export const metricOptions: MetricOption[] = [
  {
    id: "revenue",
    label: "Revenue",
    guardrail: "Aggregate only"
  },
  {
    id: "average_order_value",
    label: "Average order value",
    guardrail: "Currency normalized"
  },
  {
    id: "repeat_purchase_rate",
    label: "Repeat purchase rate",
    guardrail: "Segment safe"
  },
  {
    id: "return_rate",
    label: "Return rate",
    guardrail: "No order IDs"
  },
  {
    id: "churn_risk_proxy",
    label: "Churn risk proxy",
    guardrail: "Masked customers"
  }
];

export const piiPolicies = [
  "Mask names, emails, and phones",
  "Aggregate customer-level data only",
  "Block raw PII in generated UI",
  "Require Action Center approval"
] as const;

export const seedIntake: IntakeRequest = {
  title: "Customer360 executive dashboard",
  requesterEmail: "avery.morgan@example.com",
  businessGoal:
    "Create a Customer360 dashboard for revenue leaders to inspect retention, order health, churn risk, and support friction using approved synthetic-ready data sources.",
  targetAudience: "Revenue operations and customer success leadership",
  dueDate: "2026-07-12",
  sourceSystems: ["salesforce_crm", "snowflake_mart", "stripe_billing", "product_events"],
  constraints: ["sandbox_only", "mask_email_name_phone", "no_production_deploy"]
};

export const seedRequest: ConsoleRequest = {
  id: requestId,
  intake: seedIntake,
  status: "clarifying",
  createdAt: "2026-06-28T09:00:00.000Z",
  updatedAt: "2026-06-28T09:14:00.000Z"
};

export const clarificationQuestions: ClarificationQuestion[] = [
  {
    id: "pii_policy",
    product: "UiPath Agents",
    question: "Can individual customer names, emails, or phone numbers appear in the generated app?",
    defaultAnswer: "No. Mask names, emails, and phones; show customer IDs only when needed."
  },
  {
    id: "source_authority",
    product: "Data Service",
    question: "Which system is authoritative for customer segment and renewal status?",
    defaultAnswer: "Use Snowflake marts for segment and Salesforce CRM for renewal status."
  },
  {
    id: "approval_owner",
    product: "Action Center",
    question: "Who must approve the scope before the Codex worker receives the manifest?",
    defaultAnswer: "Revenue Ops director and Data Platform owner."
  },
  {
    id: "refresh_cadence",
    product: "API Workflow",
    question: "How fresh should dashboard data be during the demo?",
    defaultAnswer: "Use deterministic local data with a visible refresh timestamp."
  }
];

export const structuredSpec: ConsoleStructuredSpec = {
  requestId,
  objective:
    "Build a sandbox Customer360 dashboard that helps revenue teams inspect growth, retention, support friction, and churn-risk indicators without exposing raw PII.",
  requiredCapabilities: [
    "Masked customer-level drilldown",
    "Revenue, AOV, repeat purchase, return, and churn proxy metrics",
    "Segment, channel, date-range, and category filters",
    "Refresh proof using deterministic local data mutation",
    "Audit link back to Factory Console request"
  ],
  dataSources: [
    "synthetic_customers_csv",
    "synthetic_orders_csv",
    "synthetic_events_csv",
    "synthetic_returns_csv"
  ],
  acceptanceCriteria: [
    "No raw names, emails, or phone numbers render in the generated app",
    "KPI calculations are covered by metric tests",
    "Dashboard build succeeds in sandbox mode",
    "Release approval is visible before deployment"
  ],
  governanceNotes: [
    "UiPath Maestro owns lifecycle state transitions",
    "Action Center approval required before build and release",
    "Data Service-shaped records remain source of truth"
  ]
};

export const governanceAssessment: ConsoleGovernanceAssessment = {
  requestId,
  riskLevel: "medium",
  requiresHumanApproval: true,
  requiredPermissions: [
    "Read-only synthetic Customer360 sources",
    "Create sandbox build workspace",
    "Open GitHub PR or local diff",
    "Publish sandbox deployment after release approval"
  ],
  blockers: []
};

export const policyDecisions: PolicyDecision[] = [
  {
    label: "PII policy",
    value: "mask_email_name_phone",
    severity: "warning"
  },
  {
    label: "Deployment",
    value: "sandbox_only",
    severity: "success"
  },
  {
    label: "External network",
    value: "blocked without approval",
    severity: "danger"
  },
  {
    label: "Human gate",
    value: "Action Center required",
    severity: "neutral"
  }
];

export const buildManifest: BuildManifest = {
  requestId,
  template: "customer360-dashboard",
  branchName: "codex/customer360-dashboard-req-001",
  outputApp: "apps/generated-customer360-template",
  acceptanceCriteria: structuredSpec.acceptanceCriteria,
  permissions: governanceAssessment.requiredPermissions,
  codexModel: "gpt-5.5"
};

export const manifestDocument = {
  manifest_id: manifestId,
  request_id: requestId,
  manifest_hash: "sha256:5b3e0a4c9f17c21b",
  template_id: "customer360_dashboard_v1",
  artifact_type: "dashboard_app",
  platformMode: "local-simulated",
  orchestration: {
    process: "UiPath Maestro",
    approval: "Action Center",
    state_store: "Data Service",
    trigger: "API Workflow",
    worker: "Codex worker"
  },
  approved_data_sources: structuredSpec.dataSources,
  approved_metrics: [
    "revenue",
    "average_order_value",
    "repeat_purchase_rate",
    "return_rate",
    "segment_revenue",
    "cohort_retention",
    "churn_risk_proxy"
  ],
  required_filters: ["date_range", "channel", "product_category", "segment"],
  pii_policy: "mask_email_name_phone",
  output_targets: ["dashboard_app", "metric_tests", "readme", "deployment_manifest"],
  allowed_files: ["src/**", "tests/**", "public/data/**", "README.md", "deployment.json"],
  forbidden_actions: [
    "production_deploy",
    "external_network_without_approval",
    "secret_access",
    "delete_existing_files",
    "log_raw_pii"
  ],
  max_repair_attempts: 1,
  sandbox_only: true
};

export const lifecycleSteps: LifecycleStep[] = [
  {
    id: "intake",
    label: "Request intake",
    product: "Factory API",
    status: "complete"
  },
  {
    id: "clarification",
    label: "Clarification",
    product: "UiPath Agents",
    status: "complete"
  },
  {
    id: "governance",
    label: "Governance",
    product: "Governance Agent",
    status: "complete"
  },
  {
    id: "scope",
    label: "Scope approval",
    product: "Action Center",
    status: "waiting"
  },
  {
    id: "manifest",
    label: "Manifest",
    product: "Data Service",
    status: "ready"
  },
  {
    id: "build",
    label: "Build worker",
    product: "API Workflow",
    status: "ready"
  },
  {
    id: "quality",
    label: "Quality gates",
    product: "Test Manager",
    status: "ready"
  },
  {
    id: "release",
    label: "Release approval",
    product: "Action Center",
    status: "waiting"
  },
  {
    id: "deployment",
    label: "Deployment",
    product: "StartDeployment API Workflow",
    status: "ready"
  },
  {
    id: "audit",
    label: "Audit trail",
    product: "Data Service",
    status: "ready"
  }
];

export const qualityGates: QualityGate[] = [
  {
    name: "Workspace smoke",
    provider: "Test Manager catalog",
    status: "live_catalog",
    detail: "Catalog asset live; execution mapped to local smoke command",
    testCaseKey: "AFQG:2",
    evidenceCommand: "npm run smoke"
  },
  {
    name: "Metric correctness",
    provider: "Test Manager catalog",
    status: "live_catalog",
    detail: "Customer360 metric tests provide release evidence",
    testCaseKey: "AFQG:7",
    evidenceCommand: "npm --workspace @agent-factory/customer360-metrics test"
  },
  {
    name: "PII masking guardrails",
    provider: "Test Manager catalog",
    status: "live_catalog",
    detail: "Template tests and governance checklist block raw PII",
    testCaseKey: "AFQG:3",
    evidenceCommand: "npm --workspace @agent-factory/customer360-template test"
  },
  {
    name: "Generated dashboard build",
    provider: "Test Manager catalog",
    status: "live_catalog",
    detail: "Sandbox dashboard build is required before release",
    testCaseKey: "AFQG:8",
    evidenceCommand: "npm --workspace @agent-factory/customer360-template run build"
  },
  {
    name: "Manifest schema",
    provider: "Factory API / Build worker",
    status: "passed",
    detail: "Shared contract parse ready",
    testCaseKey: "AFQG:4",
    evidenceCommand: "npm --workspace @agent-factory/build-worker test"
  },
  {
    name: "Live Test Cloud execution",
    provider: "Test Cloud",
    status: "ready",
    detail: "Not run; requires explicit approval before live execution"
  }
];

export const buildArtifacts = [
  {
    path: "apps/customer360-template/src/main.tsx",
    status: "generated",
    owner: "Codex worker"
  },
  {
    path: "apps/customer360-template/test/dashboard.test.tsx",
    status: "verified",
    owner: "Test Cloud-ready"
  },
  {
    path: "apps/customer360-template/public/data/customer360-baseline.json",
    status: "synthetic",
    owner: "Data Service-shaped seed"
  },
  {
    path: "uipath/api-workflows/AgentFactory_StartDeployment/Workflow.json",
    status: "import-ready",
    owner: "UiPath API Workflow"
  }
];

export const buildRunEvidence = {
  buildRunId: "build_req_customer360_001",
  status: "awaiting_release_approval",
  workerId: "local-build-worker-01",
  codexSessionId: "codex-local-sandbox",
  branchName: buildManifest.branchName,
  commitSha: "local-demo-diff",
  pullRequestUrl: "Local diff evidence",
  logsUri: "build-worker://runs/req_customer360_checkpoint_1/logs.jsonl",
  platformMode: "uipath-ready"
};

export const buildLogEvents: BuildLogEvent[] = [
  {
    id: "log_001",
    time: "09:21",
    source: "API Workflow",
    level: "info",
    message: "AgentFactory_StartBuildWorker payload validated for sandbox mode."
  },
  {
    id: "log_002",
    time: "09:23",
    source: "Codex worker",
    level: "success",
    message: "Customer360 template files prepared with masked synthetic data and metric tests."
  },
  {
    id: "log_003",
    time: "09:26",
    source: "Test Summary Agent",
    level: "success",
    message: "Local quality evidence passed; Test Manager AFQG catalog remains live with no execution run."
  },
  {
    id: "log_004",
    time: "09:27",
    source: "Deployment worker",
    level: "warning",
    message: "StartDeployment is import-ready; live API Workflow execution waits for approval and endpoint binding."
  }
];

export const testManagerCatalog: TestManagerCatalog = {
  projectName: "Agent Factory Quality Gates",
  projectKey: "AFQG",
  projectId: "2760d770-7e82-0000-66f7-0b49d3053e3f",
  testSetName: "Customer360 Release Gate",
  testSetKey: "AFQG:1",
  testSetId: "66cdd3ea-c873-0200-58fb-0b49d305588a",
  liveExecutionStatus: "not-run",
  note: "Live catalog assets exist; live executions require explicit approval."
};

export const releaseApprovalEvidence: ReleaseApprovalEvidence = {
  status: "pending",
  approver: "Revenue Ops director",
  actionCenterMode: "uipath-ready",
  summary:
    "Release approval task contract is ready with build, test, deployment, waiver, and rollback evidence fields. No live task has been completed.",
  payloadIncludes: [
    "buildRunId",
    "branchName",
    "pullRequestUrl or local diff",
    "testRunId",
    "qualityGateDecision",
    "deployment environment",
    "rollback notes"
  ]
};

export const deploymentEvidence: DeploymentEvidence = {
  deploymentId: "dep_customer360_preview_001",
  environment: "sandbox-preview",
  status: "preview-deployed",
  provider: "Local Vite / sandbox web host",
  url: "http://localhost:5174",
  rollbackRef: "codex/customer360-dashboard-req-001@local-demo-diff",
  rollbackNotes:
    "Rollback keeps the approved template seed and removes the preview deployment pointer. Production release is not available from this flow.",
  platformMode: "local-simulated"
};

export const platformEvidence: PlatformEvidence[] = [
  {
    product: "Factory Console + Customer360",
    mode: "local-simulated",
    status: "active",
    detail: "Renders deterministic lifecycle and dashboard state without external network dependency."
  },
  {
    product: "API Workflows",
    mode: "uipath-ready",
    status: "ready",
    detail: "StartBuildWorker, RecordTestResult, and StartDeployment JSON assets are validated/import-ready."
  },
  {
    product: "Test Manager catalog",
    mode: "uipath-live",
    status: "catalog-live",
    detail: "AFQG project, release test set, and seven gate cases exist; executions are not run."
  },
  {
    product: "Maestro / Data Service / Action Center",
    mode: "uipath-ready",
    status: "pending",
    detail: "Import-ready or proposal-only assets; live deployment requires explicit approval."
  }
];

export const auditEvents: ConsoleAuditEvent[] = [
  {
    id: "audit_001",
    requestId,
    actor: "Factory Console",
    action: "seed_loaded",
    summary: "Loaded deterministic Customer360 checkpoint request.",
    createdAt: "2026-06-28T09:00:00.000Z"
  },
  {
    id: "audit_002",
    requestId,
    actor: "UiPath Maestro",
    action: "process_started",
    summary: "Maestro lifecycle instance mapped for request intake.",
    createdAt: "2026-06-28T09:03:00.000Z"
  },
  {
    id: "audit_003",
    requestId,
    actor: "UiPath Agents",
    action: "clarifications_created",
    summary: "Requirements Agent produced four bounded clarification questions.",
    createdAt: "2026-06-28T09:07:00.000Z"
  },
  {
    id: "audit_004",
    requestId,
    actor: "Governance Agent",
    action: "policy_assessed",
    summary: "Medium risk; PII masking and Action Center approval required.",
    createdAt: "2026-06-28T09:12:00.000Z"
  },
  {
    id: "audit_005",
    requestId,
    actor: "Data Service",
    action: "manifest_previewed",
    summary: "Build manifest preview created in local-simulated mode.",
    createdAt: "2026-06-28T09:14:00.000Z"
  },
  {
    id: "audit_006",
    requestId,
    actor: "Codex worker",
    action: "build_evidence_recorded",
    summary: "Sandbox Customer360 artifact evidence attached with generated files and local diff fallback.",
    createdAt: "2026-06-28T09:24:00.000Z"
  },
  {
    id: "audit_007",
    requestId,
    actor: "Test Manager",
    action: "quality_catalog_linked",
    summary: "Live AFQG quality gate catalog linked; live Test Cloud execution intentionally not run.",
    createdAt: "2026-06-28T09:27:00.000Z"
  },
  {
    id: "audit_008",
    requestId,
    actor: "Action Center",
    action: "release_approval_ready",
    summary: "Release approval payload contract includes test evidence, deployment environment, and rollback notes.",
    createdAt: "2026-06-28T09:31:00.000Z"
  },
  {
    id: "audit_009",
    requestId,
    actor: "Deployment worker",
    action: "sandbox_preview_available",
    summary: "Local preview deployment evidence attached; live StartDeployment run remains pending approval.",
    createdAt: "2026-06-28T09:34:00.000Z"
  }
];

export function createLocalRequest(intake: IntakeRequest): ConsoleRequest {
  return {
    id: requestId,
    intake,
    status: "clarifying",
    createdAt: seedRequest.createdAt,
    updatedAt: "2026-06-28T09:18:00.000Z"
  };
}

export function createConsoleAudit(summary: string, sequence = 1): ConsoleAuditEvent {
  return {
    id: `audit_console_submit_${sequence}`,
    requestId,
    actor: "Factory Console",
    action: "intake_submitted",
    summary,
    createdAt: "2026-06-28T09:18:00.000Z"
  };
}
