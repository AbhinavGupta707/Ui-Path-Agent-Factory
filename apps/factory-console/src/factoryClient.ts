import type { AutomationRequest, AutomationRequestDetail, IntakeRequest } from "@agent-factory/shared-contracts";
import type { ConsoleRequest } from "./seedData";

const DEFAULT_API_BASE_URL = "http://localhost:8787";
const REQUEST_TIMEOUT_MS = 1_200;

export type PlatformMode = "local-simulated" | "uipath-ready";

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
}

export interface LifecycleSnapshot {
  detail?: AutomationRequestDetail;
  timeline: TimelineEvent[];
  fetchedAt: string;
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
        detail: "Intake writes are routed through the local Factory API.",
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

export async function getLifecycleSnapshot(
  requestId: string,
  apiBaseUrl = getFactoryApiBaseUrl()
): Promise<LifecycleSnapshot | null> {
  try {
    const [detailResult, timelineResult] = await Promise.allSettled([
      requestJson<{ data?: AutomationRequestDetail }>(`${apiBaseUrl}/api/requests/${requestId}`, {
        method: "GET"
      }),
      requestJson<{ data?: TimelineEvent[] }>(`${apiBaseUrl}/api/requests/${requestId}/timeline`, {
        method: "GET"
      })
    ]);

    const detail = detailResult.status === "fulfilled" ? detailResult.value.data : undefined;
    const timeline = timelineResult.status === "fulfilled" ? timelineResult.value.data ?? [] : [];

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
    label: "Local simulation active",
    detail: "Factory API lifecycle endpoints are unavailable; deterministic seed state is in control."
  };
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
