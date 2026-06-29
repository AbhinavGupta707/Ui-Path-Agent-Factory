import type { BuildManifest, FactoryBuildManifest } from "@agent-factory/shared-contracts";

export interface NormalizedCodexManifest {
  requestId: string;
  manifestId?: string;
  templateId: "customer360_dashboard_v1";
  artifactType: string;
  branchName?: string;
  outputApp?: string;
  acceptanceCriteria: string[];
  allowedFiles: string[];
  approvedDataSources: string[];
  approvedMetrics: string[];
  requiredFilters: string[];
  piiPolicy: string;
  forbiddenActions: string[];
  outputTargets: string[];
  maxRepairAttempts: number;
  sandboxOnly: boolean;
  codexModel?: string;
}

export type CodexManifestInput = BuildManifest | FactoryBuildManifest | NormalizedCodexManifest;

const DEFAULT_APPROVED_DATA_SOURCES = [
  "synthetic_customers_csv",
  "synthetic_orders_csv",
  "synthetic_events_csv",
  "synthetic_returns_csv"
];

const DEFAULT_APPROVED_METRICS = [
  "revenue",
  "average_order_value",
  "repeat_purchase_rate",
  "purchase_frequency",
  "return_rate",
  "segment_revenue",
  "cohort_retention",
  "churn_risk_proxy"
];

const DEFAULT_REQUIRED_FILTERS = ["date_range", "channel", "product_category", "segment"];

const DEFAULT_OUTPUT_TARGETS = [
  "dashboard_app",
  "data_transform",
  "metric_tests",
  "readme",
  "deployment_manifest"
];

const DEFAULT_FORBIDDEN_ACTIONS = [
  "production_deploy",
  "external_network_without_approval",
  "secret_access",
  "delete_existing_files",
  "log_raw_pii"
];

export function normalizeCodexManifest(input: CodexManifestInput): NormalizedCodexManifest {
  if (isNormalizedManifest(input)) {
    return {
      ...input,
      maxRepairAttempts: clampRepairAttempts(input.maxRepairAttempts)
    };
  }

  if (isFactoryBuildManifest(input)) {
    return {
      requestId: input.request_id,
      manifestId: input.manifest_id,
      templateId: input.template_id,
      artifactType: input.artifact_type,
      acceptanceCriteria: input.output_targets_json,
      allowedFiles: input.allowed_files_json,
      approvedDataSources: input.approved_data_sources_json,
      approvedMetrics: input.approved_metrics_json,
      requiredFilters: input.required_filters_json,
      piiPolicy: input.pii_policy,
      forbiddenActions: input.forbidden_actions_json,
      outputTargets: input.output_targets_json,
      maxRepairAttempts: clampRepairAttempts(input.max_repair_attempts),
      sandboxOnly: input.sandbox_only,
      codexModel: optionalString((input as { codexModel?: unknown }).codexModel)
    };
  }

  return {
    requestId: input.requestId,
    templateId: "customer360_dashboard_v1",
    artifactType: "dashboard_app",
    branchName: input.branchName,
    outputApp: input.outputApp,
    acceptanceCriteria: input.acceptanceCriteria,
    allowedFiles: allowedFilesForLegacyManifest(input),
    approvedDataSources: DEFAULT_APPROVED_DATA_SOURCES,
    approvedMetrics: DEFAULT_APPROVED_METRICS,
    requiredFilters: DEFAULT_REQUIRED_FILTERS,
    piiPolicy: "mask_email_name_phone",
    forbiddenActions: DEFAULT_FORBIDDEN_ACTIONS,
    outputTargets: DEFAULT_OUTPUT_TARGETS,
    maxRepairAttempts: 1,
    sandboxOnly: true,
    codexModel: optionalString(input.codexModel)
  };
}

export function assertCodexManifestSafe(manifest: NormalizedCodexManifest): void {
  if (manifest.templateId !== "customer360_dashboard_v1") {
    throw new Error(`Unsupported Codex template: ${manifest.templateId}`);
  }

  if (!manifest.sandboxOnly) {
    throw new Error("Codex runner refuses manifests that are not sandbox_only.");
  }

  if (manifest.allowedFiles.length === 0) {
    throw new Error("Codex runner requires at least one allowed file boundary.");
  }

  const unsafePattern = manifest.allowedFiles.find((pattern) => !isSafeAllowedFilePattern(pattern));
  if (unsafePattern !== undefined) {
    throw new Error(`Unsafe allowed file boundary: ${unsafePattern}`);
  }

  const unsafeTarget = manifest.outputTargets.find((target) =>
    /production|secret|credential/i.test(target)
  );
  if (unsafeTarget !== undefined) {
    throw new Error(`Unsafe output target for sandbox Codex runner: ${unsafeTarget}`);
  }
}

export function allowedFileBoundaryList(manifest: NormalizedCodexManifest): string {
  return manifest.allowedFiles.map((pattern) => `- ${pattern}`).join("\n");
}

function isFactoryBuildManifest(input: CodexManifestInput): input is FactoryBuildManifest {
  return "request_id" in input;
}

function isNormalizedManifest(input: CodexManifestInput): input is NormalizedCodexManifest {
  return "templateId" in input && "allowedFiles" in input;
}

function allowedFilesForLegacyManifest(manifest: BuildManifest): string[] {
  const outputRoot = manifest.outputApp.replace(/\/+$/u, "");

  return [
    `${outputRoot}/src/**`,
    `${outputRoot}/tests/**`,
    `${outputRoot}/public/**`,
    `${outputRoot}/README.md`,
    `${outputRoot}/deployment.json`,
    `${outputRoot}/package.json`
  ];
}

function isSafeAllowedFilePattern(pattern: string): boolean {
  return (
    pattern.trim().length > 0 &&
    !pattern.startsWith("/") &&
    !pattern.startsWith("~") &&
    !pattern.includes("\\") &&
    !/(^|\/)\.\.(\/|$)/u.test(pattern)
  );
}

function clampRepairAttempts(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(3, Math.trunc(value)));
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}
