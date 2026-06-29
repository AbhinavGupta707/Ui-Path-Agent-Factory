import { describe, expect, it } from "vitest";
import { createAgentRuntime } from "../src/agentRuntime.js";
import type { ChatCompletionClient } from "../src/fireworksClient.js";
import { loadAgentProviderConfig } from "../src/providerConfig.js";
import { redactPayload } from "../src/redaction.js";
import { createInMemoryFactoryStore } from "../src/store.js";

const intakeBody = {
  requester_name: "Avery Morgan",
  requester_email: "avery@example.com",
  request_text: "I need a governed Customer360 analytics dashboard for revenue operations.",
  requested_artifact_type: "dashboard_app",
  template_id: "customer360_dashboard_v1" as const,
  priority: "normal" as const,
  owner_name: "Revenue Ops",
  owner_email: "revops@example.com",
  source_systems: ["synthetic_customers_csv"],
  requested_metrics: ["revenue"],
  constraints: []
};

describe("agent runtime provider wiring", () => {
  it("reports degraded no-key mode honestly", async () => {
    const store = createInMemoryFactoryStore({ now: () => "2026-06-28T10:00:00.000Z" });
    const record = await store.createRequest(intakeBody);
    const runtime = createAgentRuntime({
      config: loadAgentProviderConfig({})
    });

    const output = await runtime.classifyIntake(record, store.now());

    expect(runtime.getReadiness()).toMatchObject({
      provider: "fireworks",
      liveReady: false,
      degraded: true,
      missing: ["FIREWORKS_API_KEY"]
    });
    expect(output.trace.mode).toBe("degraded-no-key");
    expect(output.trace.warnings[0]).toContain("FIREWORKS_API_KEY");
  });

  it("uses a mocked Fireworks-compatible client for live schema output", async () => {
    const store = createInMemoryFactoryStore({ now: () => "2026-06-28T10:00:00.000Z" });
    const record = await store.createRequest(intakeBody);
    const client: ChatCompletionClient = {
      async complete() {
        return {
          model: "accounts/fireworks/models/gpt-oss-120b",
          content: JSON.stringify({
            complexity: "medium",
            confidence: 0.91,
            pii_likelihood: "likely",
            missing_information: ["required filters"],
            inferred_source_systems: ["synthetic_customers_csv"],
            inferred_metrics: ["revenue"],
            summary: "Customer360 request classified for live routing."
          }),
          usage: {
            prompt_tokens: 20,
            completion_tokens: 30,
            total_tokens: 50
          }
        };
      }
    };
    const runtime = createAgentRuntime({
      config: loadAgentProviderConfig({
        FIREWORKS_API_KEY: "fw_unit_test_key_not_real",
        LANGSMITH_TRACING: "true",
        LANGSMITH_API_KEY: "lsv2_unit_test_key_not_real",
        LANGSMITH_PROJECT: "agent-factory-unit"
      }),
      client
    });

    const output = await runtime.classifyIntake(record, store.now());

    expect(output.trace.mode).toBe("live");
    expect(output.trace.langsmith.enabled).toBe(true);
    expect(output.trace.redaction.raw_prompt_stored).toBe(false);
    expect(output.trace.redaction.raw_response_stored).toBe(false);
    expect(output.confidence).toBe(0.91);
  });

  it("redacts PII and secrets before audit or trace payload storage", () => {
    const redacted = redactPayload({
      note: "Avery can be reached at avery@example.com and +1 (555) 010-9999.",
      token: "sk_unit_test_secret_12345678901234567890"
    });

    expect(redacted.flags).toEqual({ piiRedacted: true, secretsRedacted: true });
    expect(redacted.value).toMatchObject({
      note: "Avery can be reached at [REDACTED_EMAIL] and [REDACTED_PHONE].",
      token: "[REDACTED_SECRET]"
    });
  });
});
