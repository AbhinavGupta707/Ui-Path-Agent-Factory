import {
  BuildManifestSchema,
  FactoryBuildManifestSchema,
  type BuildManifest,
  type PlatformMode
} from "@agent-factory/shared-contracts";

export const CUSTOMER360_TEMPLATE_ID = "customer360_dashboard_v1";
export const LEGACY_CUSTOMER360_TEMPLATE = "customer360-dashboard";

export const defaultAllowedFiles = [
  "src/**",
  "tests/**",
  "public/data/**",
  "README.md",
  "deployment.json",
  "package.json"
] as const;

export const defaultApprovedDataSources = [
  "synthetic_customers_csv",
  "synthetic_orders_csv",
  "synthetic_events_csv",
  "synthetic_returns_csv"
] as const;

export const defaultApprovedMetrics = [
  "revenue",
  "average_order_value",
  "repeat_purchase_rate",
  "purchase_frequency",
  "return_rate",
  "segment_revenue",
  "cohort_retention",
  "churn_risk_proxy"
] as const;

export const defaultRequiredFilters = ["date_range", "channel", "product_category", "segment"] as const;

export const defaultOutputTargets = [
  "dashboard_app",
  "data_transform",
  "metric_tests",
  "readme",
  "deployment_manifest"
] as const;

export const defaultForbiddenActions = [
  "production_deploy",
  "external_network_without_approval",
  "secret_access",
  "delete_existing_files",
  "log_raw_pii"
] as const;

export type WorkerPlatformMode = Extract<PlatformMode, "local-simulated" | "uipath-ready">;
export type WorkerTemplateId = typeof CUSTOMER360_TEMPLATE_ID;
export type WorkerArtifactType = "dashboard_app" | "dashboard_app_with_refresh_automation";

export interface BuildCallbacks {
  status_url?: string;
  statusWorkflow?: string;
  statusEndpoint?: string;
  auditEndpoint?: string;
}

export interface NormalizedBuildManifest {
  manifestId: string;
  requestId: string;
  templateId: WorkerTemplateId;
  artifactType: WorkerArtifactType;
  branchName: string;
  outputApp: string;
  acceptanceCriteria: string[];
  permissions: string[];
  codexModel: string;
  allowedFiles: string[];
  approvedDataSources: string[];
  approvedMetrics: string[];
  requiredFilters: string[];
  piiPolicy: string;
  forbiddenActions: string[];
  outputTargets: string[];
  maxRepairAttempts: number;
  sandboxOnly: true;
  createdAt?: string;
}

export interface NormalizedBuildRequest {
  operationId?: string;
  requestId: string;
  platformMode: WorkerPlatformMode;
  folderKey?: string;
  folderId?: string | number;
  callbacks?: BuildCallbacks;
  manifest: NormalizedBuildManifest;
}

export interface ManifestValidationIssue {
  field: string;
  message: string;
}

export class ManifestValidationError extends Error {
  readonly code = "manifest_validation_failed";

  constructor(readonly issues: ManifestValidationIssue[]) {
    super(issues.map((issue) => `${issue.field}: ${issue.message}`).join("; "));
    this.name = "ManifestValidationError";
  }
}

export function normalizeBuildManifestPayload(payload: unknown): NormalizedBuildRequest {
  const envelope = asRecord(payload);
  if (!envelope) {
    throw validationError([{ field: "body", message: "Expected a JSON object." }]);
  }

  const manifestCandidate = asRecord(envelope.manifest) ?? envelope;
  const operationId = readString(envelope, "operationId") ?? readString(envelope, "operation_id");
  const platformMode = coerceWorkerPlatformMode(envelope.platformMode);
  const callbacks = normalizeCallbacks(envelope.callbacks);
  const requestIdFromEnvelope =
    readString(envelope, "requestId") ?? readString(envelope, "request_id") ?? readString(envelope, "request_id");

  const mode = readString(envelope, "mode");
  if (mode && mode !== "sandbox") {
    throw validationError([{ field: "mode", message: "Only sandbox builds are allowed." }]);
  }

  const legacyManifest = BuildManifestSchema.safeParse(manifestCandidate);
  const manifest = legacyManifest.success
    ? normalizeLegacyManifest(legacyManifest.data, envelope)
    : normalizeFactoryManifestProjection(manifestCandidate, requestIdFromEnvelope);

  if (requestIdFromEnvelope && requestIdFromEnvelope !== manifest.requestId) {
    throw validationError([
      {
        field: "requestId",
        message: "Envelope request id must match the manifest request id."
      }
    ]);
  }

  return {
    operationId,
    requestId: manifest.requestId,
    platformMode,
    folderKey: readString(envelope, "folderKey") ?? readString(envelope, "folder_key"),
    folderId: readString(envelope, "folderId") ?? readString(envelope, "folder_id") ?? readNumber(envelope, "folderId"),
    callbacks,
    manifest
  };
}

export function validateAllowedFilePattern(pattern: string, field = "allowed_files"): string {
  const value = pattern.trim().replace(/\\/g, "/");
  const issues = validateRelativeWorkspacePath(value, field);

  if (issues.length > 0) {
    throw validationError(issues);
  }

  return value;
}

export function validateOutputPath(outputApp: string): string {
  const value = outputApp.trim().replace(/\\/g, "/");
  const issues = validateRelativeWorkspacePath(value, "outputApp");

  if (issues.length > 0) {
    throw validationError(issues);
  }

  return value;
}

export function coerceWorkerPlatformMode(value: unknown): WorkerPlatformMode {
  return value === "local-simulated" ? "local-simulated" : "uipath-ready";
}

function normalizeLegacyManifest(
  manifest: BuildManifest,
  envelope: Record<string, unknown>
): NormalizedBuildManifest {
  const normalized: NormalizedBuildManifest = {
    manifestId:
      readString(envelope, "manifestId") ?? readString(envelope, "manifest_id") ?? `MAN-${manifest.requestId}`,
    requestId: manifest.requestId,
    templateId: CUSTOMER360_TEMPLATE_ID,
    artifactType: "dashboard_app",
    branchName: manifest.branchName,
    outputApp: validateOutputPath(manifest.outputApp),
    acceptanceCriteria: manifest.acceptanceCriteria,
    permissions: manifest.permissions,
    codexModel: manifest.codexModel,
    allowedFiles: [...defaultAllowedFiles].map((pattern) => validateAllowedFilePattern(pattern)),
    approvedDataSources: [...defaultApprovedDataSources],
    approvedMetrics: [...defaultApprovedMetrics],
    requiredFilters: [...defaultRequiredFilters],
    piiPolicy: "mask_email_name_phone",
    forbiddenActions: [...defaultForbiddenActions],
    outputTargets: [...defaultOutputTargets],
    maxRepairAttempts: 1,
    sandboxOnly: true
  };

  return validateNormalizedManifest(normalized);
}

function normalizeFactoryManifestProjection(
  candidate: Record<string, unknown>,
  requestIdFromEnvelope?: string
): NormalizedBuildManifest {
  const fullFactoryManifest = FactoryBuildManifestSchema.safeParse(candidate);

  if (fullFactoryManifest.success) {
    const manifest = fullFactoryManifest.data;

    if (manifest.sandbox_only !== true) {
      throw validationError([
        { field: "sandbox_only", message: "Build worker only accepts sandbox-only manifests." }
      ]);
    }

    return validateNormalizedManifest({
      manifestId: manifest.manifest_id,
      requestId: manifest.request_id,
      templateId: manifest.template_id,
      artifactType: manifest.artifact_type,
      branchName:
        readString(candidate, "branchName") ?? readString(candidate, "branch_name") ?? defaultBranchName(manifest.request_id),
      outputApp:
        validateOutputPath(
          readString(candidate, "outputApp") ??
            readString(candidate, "output_app") ??
            "apps/generated-customer360-template"
        ),
      acceptanceCriteria:
        readStringArray(candidate, "acceptanceCriteria") ??
        readStringArray(candidate, "acceptance_criteria") ??
        ["Dashboard builds", "Metric tests pass", "PII remains masked"],
      permissions: readStringArray(candidate, "permissions") ?? [],
      codexModel: readString(candidate, "codexModel") ?? readString(candidate, "codex_model") ?? "gpt-5.5",
      allowedFiles: manifest.allowed_files_json.map((pattern) => validateAllowedFilePattern(pattern)),
      approvedDataSources: manifest.approved_data_sources_json,
      approvedMetrics: manifest.approved_metrics_json,
      requiredFilters: manifest.required_filters_json,
      piiPolicy: manifest.pii_policy,
      forbiddenActions: mergeUnique([...defaultForbiddenActions], manifest.forbidden_actions_json),
      outputTargets: manifest.output_targets_json,
      maxRepairAttempts: manifest.max_repair_attempts,
      sandboxOnly: true,
      createdAt: manifest.created_at
    });
  }

  const requestId =
    readString(candidate, "requestId") ?? readString(candidate, "request_id") ?? requestIdFromEnvelope ?? "";
  const templateId = readString(candidate, "templateId") ?? readString(candidate, "template_id");
  const legacyTemplate = readString(candidate, "template");
  const sandboxOnly = readBoolean(candidate, "sandboxOnly") ?? readBoolean(candidate, "sandbox_only") ?? true;
  const artifactType = readString(candidate, "artifactType") ?? readString(candidate, "artifact_type") ?? "dashboard_app";
  const issues: ManifestValidationIssue[] = [];

  if (!requestId) {
    issues.push({ field: "requestId", message: "A request id is required." });
  }

  if (legacyTemplate && legacyTemplate !== LEGACY_CUSTOMER360_TEMPLATE) {
    issues.push({ field: "template", message: "Only the Customer360 dashboard template is allowed." });
  }

  if (templateId && templateId !== CUSTOMER360_TEMPLATE_ID) {
    issues.push({ field: "template_id", message: "Only customer360_dashboard_v1 is allowed." });
  }

  if (!templateId && !legacyTemplate) {
    issues.push({ field: "template_id", message: "A Customer360 template id is required." });
  }

  if (sandboxOnly !== true) {
    issues.push({ field: "sandbox_only", message: "Build worker only accepts sandbox-only manifests." });
  }

  if (artifactType !== "dashboard_app" && artifactType !== "dashboard_app_with_refresh_automation") {
    issues.push({ field: "artifact_type", message: "Only Customer360 dashboard artifacts are allowed." });
  }

  if (issues.length > 0) {
    throw validationError(issues);
  }

  const allowedFiles = readStringArray(candidate, "allowedFiles") ??
    readStringArray(candidate, "allowed_files") ??
    readStringArray(candidate, "allowed_files_json") ??
    [...defaultAllowedFiles];
  const maxRepairAttempts = readNumber(candidate, "maxRepairAttempts") ??
    readNumber(candidate, "max_repair_attempts") ??
    1;

  return validateNormalizedManifest({
    manifestId: readString(candidate, "manifestId") ?? readString(candidate, "manifest_id") ?? `MAN-${requestId}`,
    requestId,
    templateId: CUSTOMER360_TEMPLATE_ID,
    artifactType: artifactType as WorkerArtifactType,
    branchName: readString(candidate, "branchName") ?? readString(candidate, "branch_name") ?? defaultBranchName(requestId),
    outputApp: validateOutputPath(
      readString(candidate, "outputApp") ?? readString(candidate, "output_app") ?? "apps/generated-customer360-template"
    ),
    acceptanceCriteria:
      readStringArray(candidate, "acceptanceCriteria") ??
      readStringArray(candidate, "acceptance_criteria") ??
      ["Dashboard builds", "Metric tests pass", "PII remains masked"],
    permissions: readStringArray(candidate, "permissions") ?? [],
    codexModel: readString(candidate, "codexModel") ?? readString(candidate, "codex_model") ?? "gpt-5.5",
    allowedFiles: allowedFiles.map((pattern) => validateAllowedFilePattern(pattern)),
    approvedDataSources:
      readStringArray(candidate, "approvedDataSources") ??
      readStringArray(candidate, "approved_data_sources") ??
      readStringArray(candidate, "approved_data_sources_json") ??
      [...defaultApprovedDataSources],
    approvedMetrics:
      readStringArray(candidate, "approvedMetrics") ??
      readStringArray(candidate, "approved_metrics") ??
      readStringArray(candidate, "approved_metrics_json") ??
      [...defaultApprovedMetrics],
    requiredFilters:
      readStringArray(candidate, "requiredFilters") ??
      readStringArray(candidate, "required_filters") ??
      readStringArray(candidate, "required_filters_json") ??
      [...defaultRequiredFilters],
    piiPolicy: readString(candidate, "piiPolicy") ?? readString(candidate, "pii_policy") ?? "mask_email_name_phone",
    forbiddenActions: mergeUnique(
      [...defaultForbiddenActions],
      readStringArray(candidate, "forbiddenActions") ??
        readStringArray(candidate, "forbidden_actions") ??
        readStringArray(candidate, "forbidden_actions_json") ??
        []
    ),
    outputTargets:
      readStringArray(candidate, "outputTargets") ??
      readStringArray(candidate, "output_targets") ??
      readStringArray(candidate, "output_targets_json") ??
      [...defaultOutputTargets],
    maxRepairAttempts,
    sandboxOnly: true,
    createdAt: readString(candidate, "createdAt") ?? readString(candidate, "created_at")
  });
}

function validateNormalizedManifest(manifest: NormalizedBuildManifest): NormalizedBuildManifest {
  const issues: ManifestValidationIssue[] = [];

  if (manifest.templateId !== CUSTOMER360_TEMPLATE_ID) {
    issues.push({ field: "template_id", message: "Only customer360_dashboard_v1 is allowed." });
  }

  if (manifest.sandboxOnly !== true) {
    issues.push({ field: "sandbox_only", message: "Build worker only accepts sandbox-only manifests." });
  }

  if (!Number.isInteger(manifest.maxRepairAttempts) || manifest.maxRepairAttempts < 0 || manifest.maxRepairAttempts > 3) {
    issues.push({ field: "max_repair_attempts", message: "Repair attempts must be an integer from 0 to 3." });
  }

  if (manifest.allowedFiles.length === 0) {
    issues.push({ field: "allowed_files", message: "At least one allowed file pattern is required." });
  }

  if (manifest.approvedDataSources.length === 0) {
    issues.push({ field: "approved_data_sources", message: "At least one approved data source is required." });
  }

  if (manifest.approvedMetrics.length === 0) {
    issues.push({ field: "approved_metrics", message: "At least one approved metric is required." });
  }

  if (!manifest.piiPolicy.trim()) {
    issues.push({ field: "pii_policy", message: "A PII policy is required." });
  }

  if (manifest.branchName.startsWith("-") || manifest.branchName.includes("..") || manifest.branchName.includes("\0")) {
    issues.push({ field: "branchName", message: "Branch names must not start with '-' or contain traversal markers." });
  }

  if (issues.length > 0) {
    throw validationError(issues);
  }

  return manifest;
}

function validateRelativeWorkspacePath(value: string, field: string): ManifestValidationIssue[] {
  const issues: ManifestValidationIssue[] = [];

  if (!value) {
    return [{ field, message: "Path or pattern must not be empty." }];
  }

  if (value.includes("\0")) {
    issues.push({ field, message: "Path or pattern contains a null byte." });
  }

  if (value.startsWith("/") || value.startsWith("//") || /^[A-Za-z]:\//.test(value)) {
    issues.push({ field, message: "Absolute paths are not allowed." });
  }

  const segments = value.split("/").filter(Boolean);

  if (segments.includes("..")) {
    issues.push({ field, message: "Parent directory traversal is not allowed." });
  }

  if (segments.includes("node_modules")) {
    issues.push({ field, message: "node_modules is outside the build boundary." });
  }

  if (segments.includes("dist")) {
    issues.push({ field, message: "dist output is outside the build boundary." });
  }

  if (segments.some((segment) => segment === ".env" || segment.startsWith(".env."))) {
    issues.push({ field, message: ".env files are outside the build boundary." });
  }

  if (hasAdjacentSegments(segments, ".uipath", ".skills")) {
    issues.push({ field, message: ".uipath/.skills must not be read or written by the worker." });
  }

  if (hasAdjacentSegments(segments, ".agents", "skills")) {
    issues.push({ field, message: ".agents/skills must not be read or written by the worker." });
  }

  return issues;
}

function hasAdjacentSegments(segments: string[], first: string, second: string): boolean {
  return segments.some((segment, index) => segment === first && segments[index + 1] === second);
}

function normalizeCallbacks(value: unknown): BuildCallbacks | undefined {
  const callbacks = asRecord(value);

  if (!callbacks) {
    return undefined;
  }

  return {
    status_url: readString(callbacks, "status_url"),
    statusWorkflow: readString(callbacks, "statusWorkflow"),
    statusEndpoint: readString(callbacks, "statusEndpoint"),
    auditEndpoint: readString(callbacks, "auditEndpoint")
  };
}

function defaultBranchName(requestId: string): string {
  const slug = requestId.toLowerCase().replace(/[^a-z0-9._/-]+/g, "-").replace(/^-+/, "");
  return `codex/${slug || "customer360-build"}`;
}

function mergeUnique(first: string[], second: string[]): string[] {
  return [...new Set([...first, ...second])];
}

function readString(record: Record<string, unknown>, field: string): string | undefined {
  const value = record[field];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function readNumber(record: Record<string, unknown>, field: string): number | undefined {
  const value = record[field];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readBoolean(record: Record<string, unknown>, field: string): boolean | undefined {
  const value = record[field];
  return typeof value === "boolean" ? value : undefined;
}

function readStringArray(record: Record<string, unknown>, field: string): string[] | undefined {
  const value = record[field];

  if (!Array.isArray(value)) {
    return undefined;
  }

  const strings = value.filter((entry): entry is string => typeof entry === "string").map((entry) => entry.trim());
  return strings.length === value.length ? strings.filter(Boolean) : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function validationError(issues: ManifestValidationIssue[]): ManifestValidationError {
  return new ManifestValidationError(issues);
}
