import type { AgentModelProfile, AgentTokenUsage } from "@agent-factory/shared-contracts";
import type { AgentProviderConfig } from "./providerConfig.js";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  profile: AgentModelProfile;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  usage?: AgentTokenUsage;
}

export interface ChatCompletionClient {
  complete(request: ChatCompletionRequest): Promise<ChatCompletionResult>;
}

interface OpenAiCompatibleResponse {
  model?: string;
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    message?: string;
  };
}

export class FireworksChatClient implements ChatCompletionClient {
  constructor(private readonly config: AgentProviderConfig) {}

  async complete(request: ChatCompletionRequest): Promise<ChatCompletionResult> {
    const apiKey = this.config.fireworks.apiKey;

    if (!apiKey) {
      throw new FireworksChatError("missing_fireworks_api_key", "FIREWORKS_API_KEY is not configured.");
    }

    const model = this.config.fireworks.models[request.profile];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.fireworks.timeoutMs);
    let response: Response;

    try {
      response = await fetch(`${this.config.fireworks.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: request.messages,
          temperature: request.temperature ?? 0.1,
          max_tokens: request.maxTokens ?? 1400,
          response_format: { type: "json_object" }
        })
      });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new FireworksChatError(
          "fireworks_request_timeout",
          `Fireworks request timed out after ${this.config.fireworks.timeoutMs}ms.`
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }

    const body = (await response.json().catch(() => ({}))) as OpenAiCompatibleResponse;

    if (!response.ok) {
      throw new FireworksChatError(
        "fireworks_request_failed",
        body.error?.message ?? `Fireworks request failed with HTTP ${response.status}.`
      );
    }

    const content = body.choices?.[0]?.message?.content;

    if (!content) {
      throw new FireworksChatError("empty_fireworks_response", "Fireworks returned no chat content.");
    }

    return {
      content,
      model: body.model ?? model,
      usage: body.usage
    };
  }
}

export class FireworksChatError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}
