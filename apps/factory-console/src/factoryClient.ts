import type {
  AutomationRequest,
  AutomationRequestDetail,
  BuildRun,
  ClarificationAnswer,
  ClarificationQuestion,
  FactoryBuildManifest,
  GovernanceAssessment,
  IntakeRequest,
  PlatformMode,
  StructuredSpec
} from "@agent-factory/shared-contracts";
import type { ConsoleRequest } from "./seedData";

const DEFAULT_API_BASE_URL = "http://localhost:8787";
const REQUEST_TIMEOUT_MS = 4_000;

type LifecycleAction =
  | "clarify"
  | "answers"
  | "spec"
  | "governance"
  | "approve-scope"
  | "manifest"
  | "queue-build"
  | "build-status"
  | "deploy";

export interface FactoryApiStatus {
  mode: "checking" | "online" | "degraded";
  platformMode: PlatformMode;
  apiBaseUrl: string;
  label: string;
  detail: string;
  requests?: number;
}

interface HealthResponse {
  ok?: boolean;
  service?: string;
  requests?: number;
  agentProvider?: {
    mode?: string;
    available?: boolean;
    detail?: string;
  };
}

interface IntakeResponse {
  data?: AutomationRequest;
}

export interface TimelineEvent {
  id: string;
  actor: string;
  action: string;
  summary: string;
  timestamp: string;
  platformMode?: PlatformMode;
}

export interface LifecycleSnapshot {
  detail?: AutomationRequestDetail;
  timeline: TimelineEvent[];
  fetchedAt: string;
}

export interface LifecycleActionResult<T> {
  ok: boolean;
  action: LifecycleAction;
  data?: T;
  status?: string;
  platformMode?: PlatformMode;
  message?: string;
}

export interface ClarifyResult {
  questions: ClarificationQuestion[];
  status: string;
}

export interface GovernanceResult {
  assessment: GovernanceAssessment;
  approvalTasks: AutomationRequestDetail["approvalTasks"];
}

export interface DeploymentResult {
  deploymentId: string;
  buildRunId: string;
  deploymentUrl: string;
  environment: string;
  status: string;
  rollbackRef?: string;
  platformMode?: PlatformMode;
}

export function getFactoryApiBaseUrl() {
  return import.meta.env.VITE_FACTORY_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

export async function checkFactoryApi(apiBaseUrl = getFactoryApiBaseUrl()): Promise<FactoryApiStatus> {
  try {
    const health = await requestJson<HealthResponse>(`${apiBaseUrl}/health`, {
      method: "GET"
    });

    if (health.ok && health.service === "factory-api") {
      return {
        mode: "online",
        platformMode: "uipath-ready",
        apiBaseUrl,
        label: "Factory API online",
        detail:
          health.agentProvider?.mode === "live"
            ? "Lifecycle endpoints are online with live provider mode available."
            : "Lifecycle endpoints are online; provider mode may be deterministic or degraded.",
        requests: health.requests
      };
    }
  } catch {
    return createDegradedStatus(apiBaseUrl);
  }

  return createDegradedStatus(apiBaseUrl);
}

export async function submitIntakeToFactoryApi(
  intake: IntakeRequest,
  apiBaseUrl = getFactoryApiBaseUrl()
): Promise<ConsoleRequest | null> {
  try {
    const response = await requestJson<IntakeResponse>(`${apiBaseUrl}/api/intake`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(intake)
    });

    return response.data ? mapAutomationRequest(response.data, intake) : null;
  } catch {
    return null;
  }
}

export async function generateClarificationQuestions(
  requestId: string,
  apiBaseUrl = getFactoryApiBaseUrl()
): Promise<LifecycleActionResult<ClarifyResult>> {
  return lifecyclePost<
    {
      questions?: ClarificationQuestion[];
      status?: string;
      platformMode?: PlatformMode;
    },
    ClarifyResult
  >("clarify", `${apiBaseUrl}/api/requests/${requestId}/clarify`, undefined, (response) => ({
    questions: response.questions ?? [],
    status: response.status ?? "clarifying"
  }));
}

export async function submitClarificationAnswers(
  requestId: string,
  answers: ClarificationAnswer[],
  apiBaseUrl = getFactoryApiBaseUrl()
): Promise<LifecycleActionResult<ClarificationAnswer[]>> {
  return lifecyclePost<
    { answers?: ClarificationAnswer[]; status?: string; platformMode?: PlatformMode },
    ClarificationAnswer[]
  >(
    "answers",
    `${apiBaseUrl}/api/requests/${requestId}/answers`,
    { answers },
    (response) => response.answers ?? []
  );
}

export async function generateStructuredSpec(
  requestId: string,
  apiBaseUrl = getFactoryApiBaseUrl()
): Promise<LifecycleActionResult<StructuredSpec>> {
  return lifecyclePost<{ data?: StructuredSpec; status?: string; platformMode?: PlatformMode }, StructuredSpec>(
    "spec",
    `${apiBaseUrl}/api/requests/${requestId}/spec`,
    undefined,
    (response) => response.data
  );
}

export async function generateGovernanceAssessment(
  requestId: string,
  apiBaseUrl = getFactoryApiBaseUrl()
): Promise<LifecycleActionResult<GovernanceResult>> {
  return lifecyclePost<
    {
      data?: GovernanceAssessment;
      approvalTasks?: AutomationRequestDetail["approvalTasks"];
      status?: string;
      platformMode?: PlatformMode;
    },
    GovernanceResult
  >("governance", `${apiBaseUrl}/api/requests/${requestId}/govern`, undefined, (response) =>
    response.data
      ? {
          assessment: response.data,
          approvalTasks: response.approvalTasks ?? []
        }
      : undefined
  );
}

export async function approveScope(
  requestId: string,
  comments: string,
  apiBaseUrl = getFactoryApiBaseUrl()
): Promise<LifecycleActionResult<AutomationRequestDetail["approvalTasks"][number]>> {
  return lifecyclePost<
    {
      data?: AutomationRequestDetail["approvalTasks"][number];
      status?: string;
      platformMode?: PlatformMode;
    },
    AutomationRequestDetail["approvalTasks"][number]
  >("approve-scope", `${apiBaseUrl}/api/requests/${requestId}/approve-scope`, { comments }, (response) => response.data);
}

export async function createBuildManifest(
  requestId: string,
  apiBaseUrl = getFactoryApiBaseUrl()
): Promise<LifecycleActionResult<FactoryBuildManifest>> {
  return lifecyclePost<
    { data?: FactoryBuildManifest; status?: string; platformMode?: PlatformMode },
    FactoryBuildManifest
  >(
    "manifest",
    `${apiBaseUrl}/api/requests/${requestId}/manifest`,
    undefined,
    (response) => response.data
  );
}

export async function queueBuildRun(
  requestId: string,
  manifestId: string | undefined,
  apiBaseUrl = getFactoryApiBaseUrl()
): Promise<LifecycleActionResult<BuildRun>> {
  return lifecyclePost<{ data?: BuildRun; status?: string; platformMode?: PlatformMode }, BuildRun>(
    "queue-build",
    `${apiBaseUrl}/api/builds`,
    {
      request_id: requestId,
      manifest_id: manifestId,
      mode: "sandbox"
    },
    (response) => response.data
  );
}

export async function updateBuildRunStatus(
  buildRunId: string,
  status: BuildRun["status"],
  apiBaseUrl = getFactoryApiBaseUrl()
): Promise<LifecycleActionResult<BuildRun>> {
  return lifecyclePost<{ data?: BuildRun; status?: string; platformMode?: PlatformMode }, BuildRun>(
    "build-status",
    `${apiBaseUrl}/api/builds/${buildRunId}/status`,
    {
      status,
      worker_id: "factory-console-demo",
      generated_files_json: ["apps/customer360-template/src/main.tsx", "apps/customer360-template/test/dashboard.test.tsx"]
    },
    (response) => response.data
  );
}

export async function recordSandboxDeployment(
  requestId: string,
  buildRunId: string,
  deploymentUrl: string,
  apiBaseUrl = getFactoryApiBaseUrl()
): Promise<LifecycleActionResult<DeploymentResult>> {
  return lifecyclePost<Record<string, unknown>, DeploymentResult>(
    "deploy",
    `${apiBaseUrl}/deploy`,
    {
      operationId: `factory-console-${requestId}-${buildRunId}`,
      requestId,
      buildRunId,
      environment: "sandbox",
      deploymentProvider: "local-sandbox",
      deploymentUrl,
      releaseApproval: {
        status: "approved",
        decidedBy: "Factory Console"
      },
      rollbackNotes: "Sandbox preview evidence recorded from the Product UI lane."
    },
    (response) => ({
      deploymentId: readString(response, "deploymentId") ?? readString(response, "deployment_id") ?? "deployment-pending",
      buildRunId: readString(response, "buildRunId") ?? readString(response, "build_run_id") ?? buildRunId,
      deploymentUrl: readString(response, "deploymentUrl") ?? readString(response, "app_url") ?? deploymentUrl,
      environment: readString(response, "environment") ?? "sandbox",
      status: readString(response, "deploymentStatus") ?? readString(response, "status") ?? "deployed",
      rollbackRef: readString(response, "rollback_ref"),
      platformMode: readPlatformMode(response)
    })
  );
}

export async function getLifecycleSnapshot(
  requestId: string,
  apiBaseUrl = getFactoryApiBaseUrl()
): Promise<LifecycleSnapshot | null> {
  try {
    const [detailResult, timelineResult] = await Promise.allSettled([
      requestJson<{ data?: AutomationRequestDetail }>(`${apiBaseUrl}/api/requests/${requestId}`, {
        method: "GET"
      }),
      requestJson<{ data?: Array<Record<string, unknown>> }>(`${apiBaseUrl}/api/requests/${requestId}/timeline`, {
        method: "GET"
      })
    ]);

    const detail = detailResult.status === "fulfilled" ? detailResult.value.data : undefined;
    const timeline =
      timelineResult.status === "fulfilled" ? (timelineResult.value.data ?? []).map(normalizeTimelineEvent) : [];

    if (!detail && timeline.length === 0) {
      return null;
    }

    return {
      detail,
      timeline,
      fetchedAt: new Date().toISOString()
    };
  } catch {
    return null;
  }
}

function mapAutomationRequest(request: AutomationRequest, intake: IntakeRequest): ConsoleRequest {
  return {
    id: request.request_id,
    intake,
    status: request.status,
    createdAt: request.created_at,
    updatedAt: request.updated_at
  };
}

function createDegradedStatus(apiBaseUrl: string): FactoryApiStatus {
  return {
    mode: "degraded",
    platformMode: "local-simulated",
    apiBaseUrl,
    label: "Lifecycle API unavailable",
    detail: "Live mode is not active. The UI is showing explicit offline rehearsal state until the Factory API is reachable."
  };
}

async function lifecyclePost<TResponse extends { status?: string; platformMode?: PlatformMode }, TData>(
  action: LifecycleAction,
  url: string,
  body: unknown,
  mapData: (response: TResponse) => TData | undefined
): Promise<LifecycleActionResult<TData>> {
  try {
    const response = await requestJson<TResponse>(url, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(body ?? {})
    });

    return {
      ok: true,
      action,
      data: mapData(response),
      status: response.status,
      platformMode: response.platformMode
    };
  } catch (error) {
    return {
      ok: false,
      action,
      message: error instanceof Error ? error.message : "Lifecycle endpoint unavailable"
    };
  }
}

function normalizeTimelineEvent(event: Record<string, unknown>): TimelineEvent {
  return {
    id: readString(event, "id") ?? readString(event, "event_id") ?? `timeline-${Date.now()}`,
    actor: readString(event, "actor") ?? readString(event, "actor_name") ?? "Factory API",
    action: readString(event, "action") ?? "event",
    summary: readString(event, "summary") ?? "",
    timestamp: readString(event, "timestamp") ?? readString(event, "createdAt") ?? new Date().toISOString(),
    platformMode: readPlatformMode(event)
  };
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function readPlatformMode(record: Record<string, unknown>): PlatformMode | undefined {
  const value = record.platformMode;
  return value === "local-simulated" || value === "uipath-ready" || value === "uipath-live" ? value : undefined;
}

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Factory API returned ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeout);
  }
}
