import { describe, expect, it } from "vitest";
import { createAgentRuntime } from "../src/agentRuntime.js";
import { FireworksChatClient, type ChatCompletionClient } from "../src/fireworksClient.js";
import {
  generateClarificationQuestions,
  generateGovernanceAssessment,
  generateStructuredSpec
} from "../src/lifecycle.js";
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

  it("normalizes provider intake complexity labels", async () => {
    const store = createInMemoryFactoryStore({ now: () => "2026-06-28T10:00:00.000Z" });
    const record = await store.createRequest(intakeBody);
    const client: ChatCompletionClient = {
      async complete() {
        return {
          model: "accounts/fireworks/models/glm-5p2",
          content: JSON.stringify({
            complexity: "medium-to-high",
            confidence: "87%",
            pii_likelihood: "moderate",
            missing_information: [{ description: "approval owner" }],
            inferred_source_systems: [{ name: "synthetic_customers_csv" }],
            inferred_metrics: [{ metric: "revenue" }],
            summary: "The request needs governed source and approval details."
          })
        };
      }
    };
    const runtime = createAgentRuntime({
      config: loadAgentProviderConfig({
        FIREWORKS_API_KEY: "fw_unit_test_key_not_real"
      }),
      client
    });

    const output = await runtime.classifyIntake(record, store.now());

    expect(output.trace.mode).toBe("live");
    expect(output.complexity).toBe("high");
    expect(output.confidence).toBe(0.87);
    expect(output.pii_likelihood).toBe("possible");
  });

  it("times out slow Fireworks requests so the runtime can degrade", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = ((_input, init) =>
      new Promise((_resolve, reject) => {
        const signal = init?.signal;
        if (signal) {
          signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        }
      })) as typeof fetch;

    try {
      const client = new FireworksChatClient(
        loadAgentProviderConfig({
          FIREWORKS_API_KEY: "fw_unit_test_key_not_real",
          FIREWORKS_TIMEOUT_MS: "1"
        })
      );

      await expect(
        client.complete({
          profile: "fast",
          messages: [{ role: "user", content: "Return JSON." }]
        })
      ).rejects.toMatchObject({ code: "fireworks_request_timeout" });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("generates degraded no-key clarification questions with labeled deterministic fallback", async () => {
    const store = createInMemoryFactoryStore({ now: () => "2026-06-28T10:00:00.000Z" });
    const record = await store.createRequest({
      ...intakeBody,
      source_systems: [],
      requested_metrics: [],
      constraints: []
    });
    const runtime = createAgentRuntime({
      config: loadAgentProviderConfig({})
    });

    const output = await runtime.generateClarificationQuestions(record, store.now());

    expect(output.trace.step_id).toBe("clarification_generation");
    expect(output.trace.mode).toBe("degraded-no-key");
    expect(output.missing_fields).toEqual(
      expect.arrayContaining(["approved data sources", "required metrics", "release approval owner"])
    );
    expect(output.basis.constraints).toEqual(["sandbox-only preview"]);
    expect(output.questions[0]?.source).toContain("degraded: no provider key");
  });

  it("uses live provider clarification output without storing raw prompts or contact fields", async () => {
    const store = createInMemoryFactoryStore({ now: () => "2026-06-28T10:00:00.000Z" });
    const record = await store.createRequest(intakeBody);
    const prompts: string[] = [];
    const client: ChatCompletionClient = {
      async complete(request) {
        prompts.push(request.messages.map((message) => message.content).join("\n"));
        return {
          model: "accounts/fireworks/models/gpt-oss-120b",
          content: JSON.stringify({
            questions: [
              {
                id: "refresh_cadence",
                question: "What refresh cadence should the Customer360 dashboard use for sandbox review?",
                default: "Daily sandbox refresh",
                required: true
              },
              {
                id: "metric_definition",
                question: "Which revenue definition should the dashboard use for the selected metrics?",
                default: "Net revenue",
                required: true
              },
              {
                id: "release_owner",
                question: "Which role should approve the sandbox release after quality checks pass?",
                default: "Revenue Ops owner",
                required: true
              }
            ],
            missing_fields: ["refresh cadence", "release approval owner"],
            selected_sources: ["synthetic_customers_csv"],
            requested_metrics: ["revenue"],
            constraints: ["sandbox-only preview"]
          }),
          usage: {
            prompt_tokens: 25,
            completion_tokens: 40,
            total_tokens: 65
          }
        };
      }
    };
    const runtime = createAgentRuntime({
      config: loadAgentProviderConfig({
        FIREWORKS_API_KEY: "fw_unit_test_key_not_real"
      }),
      client
    });

    const output = await runtime.generateClarificationQuestions(record, store.now());

    expect(output.trace.mode).toBe("live");
    expect(output.questions.map((question) => question.id)).toEqual([
      "refresh_cadence",
      "metric_definition",
      "release_owner",
      "pii_policy",
      "approved_sources",
      "approved_metrics",
      "required_filters"
    ]);
    expect(output.questions[0]?.source).toContain("Fireworks live");
    expect(output.trace.redaction.raw_prompt_stored).toBe(false);
    expect(output.trace.redaction.raw_response_stored).toBe(false);
    expect(prompts.join("\n")).not.toContain(intakeBody.requester_email);
    expect(prompts.join("\n")).not.toContain(intakeBody.owner_email);
  });

  it("accepts provider clarification questions without defaults and caps long lists", async () => {
    const store = createInMemoryFactoryStore({ now: () => "2026-06-28T10:00:00.000Z" });
    const record = await store.createRequest(intakeBody);
    const client: ChatCompletionClient = {
      async complete() {
        return {
          model: "accounts/fireworks/models/glm-5p2",
          content: JSON.stringify({
            questions: Array.from({ length: 9 }, (_, index) => ({
              id: `Q${index + 1}`,
              question: `Which sandbox governance detail ${index + 1} should be confirmed before build?`
            })),
            missing_fields: ["approval owner"],
            selected_sources: ["synthetic_customers_csv"],
            requested_metrics: ["revenue"],
            constraints: ["sandbox-only preview"]
          })
        };
      }
    };
    const runtime = createAgentRuntime({
      config: loadAgentProviderConfig({
        FIREWORKS_API_KEY: "fw_unit_test_key_not_real"
      }),
      client
    });

    const output = await runtime.generateClarificationQuestions(record, store.now());

    expect(output.trace.mode).toBe("live");
    expect(output.questions).toHaveLength(7);
    expect(output.questions[0]?.default).toContain("approved sandbox default");
  });

  it("normalizes provider clarification question text aliases and required flags", async () => {
    const store = createInMemoryFactoryStore({ now: () => "2026-06-28T10:00:00.000Z" });
    const record = await store.createRequest(intakeBody);
    const client: ChatCompletionClient = {
      async complete() {
        return {
          model: "accounts/fireworks/models/glm-5p2",
          content: JSON.stringify({
            questions: [
              {
                key: "source-owner",
                text: "Which owner approved the Customer360 source mapping for the sandbox build?",
                default_answer: "Revenue Ops director",
                required: "yes"
              },
              {
                id: "metric-window",
                prompt: "Which reporting window should revenue and retention metrics use for the demo?",
                suggested_answer: "Last two quarters",
                mandatory: "true"
              },
              {
                clarification_question: "Should direct identifiers stay masked in every generated table and card?",
                recommended_default: "Yes, mask names, emails, and phones.",
                is_required: "1"
              }
            ],
            missing_fields: ["approval owner"],
            selected_sources: ["synthetic_customers_csv"],
            requested_metrics: ["revenue"],
            constraints: ["sandbox-only preview"]
          })
        };
      }
    };
    const runtime = createAgentRuntime({
      config: loadAgentProviderConfig({
        FIREWORKS_API_KEY: "fw_unit_test_key_not_real"
      }),
      client
    });

    const output = await runtime.generateClarificationQuestions(record, store.now());

    expect(output.trace.mode).toBe("live");
    expect(output.questions.map((question) => question.id)).toEqual([
      "source_owner",
      "metric_window",
      "should_direct_identifiers_stay_masked_in_every_g",
      "pii_policy",
      "approved_sources",
      "approved_metrics",
      "required_filters"
    ]);
    expect(output.questions.every((question) => question.required)).toBe(true);
    expect(output.questions[0]?.default).toBe("Revenue Ops director");
  });

  it("tops up partial live clarification questions with deterministic guardrail questions", async () => {
    const store = createInMemoryFactoryStore({ now: () => "2026-06-28T10:00:00.000Z" });
    const record = await store.createRequest(intakeBody);
    const client: ChatCompletionClient = {
      async complete() {
        return {
          model: "accounts/fireworks/models/glm-5p2",
          content: JSON.stringify({
            questions: [
              {
                question: "Which executive approver owns the sandbox Customer360 dashboard release?",
                default: "Revenue Ops director"
              }
            ],
            missing_fields: ["approval owner"],
            selected_sources: ["synthetic_customers_csv"],
            requested_metrics: ["revenue"],
            constraints: ["sandbox-only preview"]
          })
        };
      }
    };
    const runtime = createAgentRuntime({
      config: loadAgentProviderConfig({
        FIREWORKS_API_KEY: "fw_unit_test_key_not_real"
      }),
      client
    });

    const output = await runtime.generateClarificationQuestions(record, store.now());

    expect(output.trace.mode).toBe("live");
    expect(output.questions).toHaveLength(6);
    expect(output.questions[0]?.source).toContain("Fireworks live");
    expect(output.questions.slice(1).some((question) => question.source.includes("deterministic fallback"))).toBe(true);
  });

  it("falls back to deterministic clarification questions when provider schema validation fails", async () => {
    const store = createInMemoryFactoryStore({ now: () => "2026-06-28T10:00:00.000Z" });
    const record = await store.createRequest(intakeBody);
    const attemptedProfiles: string[] = [];
    const client: ChatCompletionClient = {
      async complete(request) {
        attemptedProfiles.push(request.profile);
        return {
          model: `model-for-${request.profile}`,
          content: JSON.stringify({ questions: [] })
        };
      }
    };
    const runtime = createAgentRuntime({
      config: loadAgentProviderConfig({
        FIREWORKS_API_KEY: "fw_unit_test_key_not_real"
      }),
      client
    });

    const output = await runtime.generateClarificationQuestions(record, store.now());

    expect(attemptedProfiles).toEqual(["fast", "fallback"]);
    expect(output.trace.mode).toBe("degraded-provider-error");
    expect(output.questions.map((question) => question.id)).toContain("pii_policy");
    expect(output.questions[0]?.source).toContain("degraded: provider error");
  });

  it("retries the fallback model profile when the primary profile cannot produce schema-valid JSON", async () => {
    const store = createInMemoryFactoryStore({ now: () => "2026-06-28T10:00:00.000Z" });
    const record = await store.createRequest(intakeBody);
    const attemptedProfiles: string[] = [];
    const requestedTokenBudgets: Array<number | undefined> = [];
    const client: ChatCompletionClient = {
      async complete(request) {
        attemptedProfiles.push(request.profile);
        requestedTokenBudgets.push(request.maxTokens);
        if (request.profile === "fast") {
          return {
            model: "accounts/fireworks/models/gpt-oss-120b",
            content: JSON.stringify({ type: "object" })
          };
        }

        return {
          model: "accounts/fireworks/models/glm-5p2",
          content: JSON.stringify({
            complexity: "medium",
            confidence: 0.88,
            pii_likelihood: "possible",
            missing_information: [],
            inferred_source_systems: ["synthetic_customers_csv"],
            inferred_metrics: ["revenue"],
            summary: "Fallback model repaired the live classification output."
          }),
          usage: {
            prompt_tokens: 30,
            completion_tokens: 35,
            total_tokens: 65
          }
        };
      }
    };
    const runtime = createAgentRuntime({
      config: loadAgentProviderConfig({
        FIREWORKS_API_KEY: "fw_unit_test_key_not_real",
        AGENT_MODEL_FAST: "accounts/fireworks/models/gpt-oss-120b",
        AGENT_MODEL_FALLBACK: "accounts/fireworks/models/glm-5p2"
      }),
      client
    });

    const output = await runtime.classifyIntake(record, store.now());

    expect(attemptedProfiles).toEqual(["fast", "fallback"]);
    expect(requestedTokenBudgets).toEqual([1600, 1600]);
    expect(output.trace.mode).toBe("live");
    expect(output.trace.profile).toBe("fallback");
    expect(output.trace.model_id).toBe("accounts/fireworks/models/glm-5p2");
    expect(output.trace.warnings).toContain(
      "Primary model profile failed validation or request handling; fallback model profile was retried."
    );
    expect(output.confidence).toBe(0.88);
  });

  it("normalizes common provider classification shapes into the runtime contract", async () => {
    const store = createInMemoryFactoryStore({ now: () => "2026-06-28T10:00:00.000Z" });
    const record = await store.createRequest(intakeBody);
    const client: ChatCompletionClient = {
      async complete() {
        return {
          model: "accounts/fireworks/models/glm-5p2",
          content: JSON.stringify({
            complexity: "high",
            confidence: "high",
            pii_likelihood: "low",
            missing_information: [{ description: "Data refresh cadence" }],
            inferred_source_systems: [{ name: "Salesforce CRM" }],
            inferred_metrics: [{ metric: "revenue" }],
            summary: "Provider classification used ordinal and object-shaped fields."
          })
        };
      }
    };
    const runtime = createAgentRuntime({
      config: loadAgentProviderConfig({
        FIREWORKS_API_KEY: "fw_unit_test_key_not_real"
      }),
      client
    });

    const output = await runtime.classifyIntake(record, store.now());

    expect(output.trace.mode).toBe("live");
    expect(output.confidence).toBe(0.85);
    expect(output.pii_likelihood).toBe("possible");
    expect(output.missing_information).toEqual(["Data refresh cadence"]);
    expect(output.inferred_source_systems).toEqual(["Salesforce CRM"]);
    expect(output.inferred_metrics).toEqual(["revenue"]);
  });

  it("parses final JSON from channel-style provider text", async () => {
    const store = createInMemoryFactoryStore({ now: () => "2026-06-28T10:00:00.000Z" });
    const record = await store.createRequest(intakeBody);
    const client: ChatCompletionClient = {
      async complete() {
        return {
          model: "accounts/fireworks/models/gpt-oss-120b",
          content: [
            '<|channel|>analysis<|message|>The requested shape is {"complexity":"low"}.',
            '<|channel|>final<|message|>{"complexity":"medium","confidence":0.92,"pii_likelihood":"possible","missing_information":["approval owner"],"inferred_source_systems":["synthetic_customers_csv"],"inferred_metrics":["revenue"],"summary":"Parsed final JSON object."}'
          ].join("\\n")
        };
      }
    };
    const runtime = createAgentRuntime({
      config: loadAgentProviderConfig({
        FIREWORKS_API_KEY: "fw_unit_test_key_not_real"
      }),
      client
    });

    const output = await runtime.classifyIntake(record, store.now());

    expect(output.trace.mode).toBe("live");
    expect(output.confidence).toBe(0.92);
    expect(output.summary).toBe("Parsed final JSON object.");
  });

  it("normalizes object-shaped requirements lists from provider output", async () => {
    const store = createInMemoryFactoryStore({ now: () => "2026-06-28T10:00:00.000Z" });
    const initialRecord = await store.createRequest(intakeBody);
    const questions = generateClarificationQuestions(initialRecord);
    await store.saveClarificationQuestions(initialRecord.request.request_id, questions);
    const record = await store.saveClarificationAnswers(
      initialRecord.request.request_id,
      questions.map((question) => ({
        question_id: question.id,
        answer: question.default,
        answered_by: "Avery Morgan",
        answered_at: store.now()
      }))
    );
    const client: ChatCompletionClient = {
      async complete() {
        return {
          model: "accounts/fireworks/models/glm-5p2",
          content: JSON.stringify({
            business_goal: "Deliver a governed Customer360 dashboard for revenue operations leaders.",
            data_sources_json: [{ name: "Salesforce CRM" }],
            metrics_json: [{ metric: "average order value" }],
            filters_json: [{ filter: "segment" }],
            constraints_json: [{ constraint: "sandbox deployment only" }],
            assumptions: [{ assumption: "Synthetic-ready data is available." }]
          })
        };
      }
    };
    const runtime = createAgentRuntime({
      config: loadAgentProviderConfig({
        FIREWORKS_API_KEY: "fw_unit_test_key_not_real"
      }),
      client
    });

    const output = await runtime.generateRequirementsSpec(record, store.now());

    expect(output.trace.mode).toBe("live");
    expect(output.spec.data_sources_json).toEqual(["Salesforce CRM"]);
    expect(output.spec.metrics_json).toEqual(["average order value"]);
    expect(output.spec.filters_json).toEqual(["segment"]);
    expect(output.spec.constraints_json).toContain("sandbox deployment only");
    expect(output.assumptions).toEqual(["Synthetic-ready data is available."]);
  });

  it("coerces provider governance PII field lists into pii_detected", async () => {
    const store = createInMemoryFactoryStore({ now: () => "2026-06-28T10:00:00.000Z" });
    const initialRecord = await store.createRequest(intakeBody);
    const spec = generateStructuredSpec(initialRecord, store.now());
    const record = await store.saveStructuredSpec(initialRecord.request.request_id, spec);
    const client: ChatCompletionClient = {
      async complete() {
        return {
          model: "accounts/fireworks/models/glm-5p2",
          content: JSON.stringify({
            risk_tier: "medium",
            pii_detected: ["email", "name", "phone"],
            pii_policy: "Mask direct identifiers before sandbox display.",
            forbidden_actions_json: ["production deployment"],
            required_approvals_json: ["Data owner approval"],
            policy_decisions_json: ["Sandbox-only build approved"],
            policy_violations_json: []
          })
        };
      }
    };
    const runtime = createAgentRuntime({
      config: loadAgentProviderConfig({
        FIREWORKS_API_KEY: "fw_unit_test_key_not_real"
      }),
      client
    });

    const output = await runtime.generateGovernance(record, store.now());

    expect(output.trace.mode).toBe("live");
    expect(output.assessment.pii_detected).toBe(true);
    expect(output.assessment.pii_policy).toBe("Mask direct identifiers before sandbox display.");
  });

  it("normalizes object-shaped build plan instructions from provider output", async () => {
    const store = createInMemoryFactoryStore({ now: () => "2026-06-28T10:00:00.000Z" });
    const initialRecord = await store.createRequest(intakeBody);
    const spec = generateStructuredSpec(initialRecord, store.now());
    const specRecord = await store.saveStructuredSpec(initialRecord.request.request_id, spec);
    const governance = generateGovernanceAssessment(specRecord, spec, store.now());
    const record = await store.saveGovernanceAssessment(
      specRecord.request.request_id,
      governance.assessment,
      governance.approvalTasks
    );
    const client: ChatCompletionClient = {
      async complete() {
        return {
          model: "accounts/fireworks/models/glm-5p2",
          content: JSON.stringify({
            worker_instructions: [
              {
                action: "apply_pii_masking",
                details: "Mask names, emails, and phone numbers before rendering."
              }
            ],
            acceptance_criteria: [{ criterion: "Dashboard remains sandbox-only." }]
          })
        };
      }
    };
    const runtime = createAgentRuntime({
      config: loadAgentProviderConfig({
        FIREWORKS_API_KEY: "fw_unit_test_key_not_real"
      }),
      client
    });

    const output = await runtime.generateBuildPlan(record, store.now());

    expect(output.trace.mode).toBe("live");
    expect(output.worker_instructions[0]).toBe(
      "apply_pii_masking: Mask names, emails, and phone numbers before rendering."
    );
    expect(output.acceptance_criteria).toEqual(["Dashboard remains sandbox-only."]);
  });

  it("keeps degraded-provider-error mode when both primary and fallback model profiles fail", async () => {
    const store = createInMemoryFactoryStore({ now: () => "2026-06-28T10:00:00.000Z" });
    const record = await store.createRequest(intakeBody);
    const attemptedProfiles: string[] = [];
    const client: ChatCompletionClient = {
      async complete(request) {
        attemptedProfiles.push(request.profile);
        return {
          model: `model-for-${request.profile}`,
          content: JSON.stringify({ type: "object" })
        };
      }
    };
    const runtime = createAgentRuntime({
      config: loadAgentProviderConfig({
        FIREWORKS_API_KEY: "fw_unit_test_key_not_real"
      }),
      client
    });

    const output = await runtime.classifyIntake(record, store.now());

    expect(attemptedProfiles).toEqual(["fast", "fallback"]);
    expect(output.trace.mode).toBe("degraded-provider-error");
    expect(output.trace.warnings).toEqual([
      "Primary model profile failed validation or request handling; fallback model profile was retried.",
      "Fallback model profile failed validation or request handling; deterministic fallback output was used."
    ]);
    expect(output.confidence).toBe(0.78);
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
