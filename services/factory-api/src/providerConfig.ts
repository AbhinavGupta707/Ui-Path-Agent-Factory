import type { AgentModelProfile } from "@agent-factory/shared-contracts";

export type AgentRuntimeConfigMode = "auto" | "live" | "deterministic";

export interface AgentProviderConfig {
  runtimeMode: AgentRuntimeConfigMode;
  fireworks: {
    baseUrl: string;
    apiKey?: string;
    apiKeyPresent: boolean;
    timeoutMs: number;
    models: Record<AgentModelProfile, string>;
  };
  langsmith: {
    tracingEnabled: boolean;
    apiKeyPresent: boolean;
    project: string;
  };
}

export interface AgentProviderReadiness {
  provider: "fireworks";
  runtimeMode: AgentRuntimeConfigMode;
  liveReady: boolean;
  degraded: boolean;
  missing: string[];
  modelProfiles: Record<AgentModelProfile, string>;
  langsmith: {
    tracingEnabled: boolean;
    project: string;
    apiKeyPresent: boolean;
  };
}

const defaultModels: Record<AgentModelProfile, string> = {
  fast: "accounts/fireworks/models/glm-5p2",
  reasoning: "accounts/fireworks/models/glm-5p2",
  code: "accounts/fireworks/models/glm-5p2",
  fallback: "accounts/fireworks/models/glm-5p2"
};

export function loadAgentProviderConfig(env: NodeJS.ProcessEnv = process.env): AgentProviderConfig {
  const runtimeMode = parseRuntimeMode(env.AGENT_RUNTIME_MODE);
  const fireworksApiKey = readOptional(env.FIREWORKS_API_KEY);

  return {
    runtimeMode,
    fireworks: {
      apiKey: fireworksApiKey,
      apiKeyPresent: Boolean(fireworksApiKey),
      baseUrl: readOptional(env.FIREWORKS_BASE_URL) ?? "https://api.fireworks.ai/inference/v1",
      timeoutMs: parsePositiveInteger(env.FIREWORKS_TIMEOUT_MS, 20_000),
      models: {
        fast: readOptional(env.AGENT_MODEL_FAST) ?? defaultModels.fast,
        reasoning: readOptional(env.AGENT_MODEL_REASONING) ?? defaultModels.reasoning,
        code: readOptional(env.AGENT_MODEL_CODE) ?? defaultModels.code,
        fallback: readOptional(env.AGENT_MODEL_FALLBACK) ?? defaultModels.fallback
      }
    },
    langsmith: {
      tracingEnabled: parseBoolean(env.LANGSMITH_TRACING),
      apiKeyPresent: Boolean(readOptional(env.LANGSMITH_API_KEY)),
      project: readOptional(env.LANGSMITH_PROJECT) ?? "agent-factory-live"
    }
  };
}

export function getAgentProviderReadiness(config: AgentProviderConfig): AgentProviderReadiness {
  const missing = [
    config.fireworks.apiKeyPresent ? undefined : "FIREWORKS_API_KEY",
    config.langsmith.tracingEnabled && !config.langsmith.apiKeyPresent ? "LANGSMITH_API_KEY" : undefined
  ].filter((value): value is string => Boolean(value));
  const liveReady = config.runtimeMode !== "deterministic" && config.fireworks.apiKeyPresent;

  return {
    provider: "fireworks",
    runtimeMode: config.runtimeMode,
    liveReady,
    degraded: !liveReady,
    missing,
    modelProfiles: config.fireworks.models,
    langsmith: {
      tracingEnabled: config.langsmith.tracingEnabled,
      project: config.langsmith.project,
      apiKeyPresent: config.langsmith.apiKeyPresent
    }
  };
}

function parseRuntimeMode(value: string | undefined): AgentRuntimeConfigMode {
  if (value === "live" || value === "deterministic") {
    return value;
  }

  return "auto";
}

function parseBoolean(value: string | undefined): boolean {
  return ["1", "true", "yes", "on"].includes((value ?? "").toLowerCase());
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}
