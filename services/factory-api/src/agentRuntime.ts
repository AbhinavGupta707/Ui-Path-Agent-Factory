import { z } from "zod";
import {
  ApprovalTaskSchema,
  BuildPlanAgentOutputSchema,
  FactoryBuildManifestSchema,
  GovernanceAgentOutputSchema,
  GovernanceAssessmentSchema,
  IntakeClassificationOutputSchema,
  RequirementsSpecGenerationOutputSchema,
  StructuredSpecSchema,
  type AgentModelProfile,
  type AgentRuntimeMode,
  type AgentStepId,
  type AgentStepTraceEnvelope,
  type BuildPlanAgentOutput,
  type GovernanceAgentOutput,
  type IntakeClassificationOutput,
  type RequirementsSpecGenerationOutput
} from "@agent-factory/shared-contracts";
import { FireworksChatClient, type ChatCompletionClient, type ChatCompletionResult } from "./fireworksClient.js";
import {
  generateBuildManifest,
  generateGovernanceAssessment,
  generateStructuredSpec
} from "./lifecycle.js";
import {
  getAgentProviderReadiness,
  loadAgentProviderConfig,
  type AgentProviderConfig,
  type AgentProviderReadiness
} from "./providerConfig.js";
import type { FactoryRequestRecord } from "./store.js";

const classificationPayloadSchema = z.object({
  complexity: z.enum(["low", "medium", "high"]),
  confidence: z.number().min(0).max(1),
  pii_likelihood: z.enum(["none", "possible", "likely"]),
  missing_information: z.array(z.string().min(1)).default([]),
  inferred_source_systems: z.array(z.string().min(1)).default([]),
  inferred_metrics: z.array(z.string().min(1)).default([]),
  summary: z.string().min(1)
});

const requirementsPayloadSchema = z.object({
  business_goal: z.string().min(12),
  data_sources_json: z.array(z.string().min(1)).default([]),
  metrics_json: z.array(z.string().min(1)).default([]),
  filters_json: z.array(z.string().min(1)).default([]),
  constraints_json: z.array(z.string().min(1)).default([]),
  assumptions: z.array(z.string().min(1)).default([])
});

const governancePayloadSchema = z.object({
  risk_tier: z.enum(["low", "medium", "high"]),
  pii_detected: z.boolean(),
  pii_policy: z.string().min(1),
  forbidden_actions_json: z.array(z.string().min(1)).default([]),
  required_approvals_json: z.array(z.string().min(1)).default([]),
  policy_decisions_json: z.array(z.string().min(1)).default([]),
  policy_violations_json: z.array(z.string().min(1)).default([])
});

const buildPlanPayloadSchema = z.object({
  worker_instructions: z.array(z.string().min(1)).default([]),
  acceptance_criteria: z.array(z.string().min(1)).default([])
});

export interface AgentRuntimeOptions {
  config?: AgentProviderConfig;
  client?: ChatCompletionClient;
}

interface ProviderRunResult<T> {
  payload?: T;
  trace: AgentStepTraceEnvelope;
}

export class AgentRuntime {
  private readonly config: AgentProviderConfig;
  private readonly client: ChatCompletionClient;

  constructor(options: AgentRuntimeOptions = {}) {
    this.config = options.config ?? loadAgentProviderConfig();
    this.client = options.client ?? new FireworksChatClient(this.config);
  }

  getReadiness(): AgentProviderReadiness {
    return getAgentProviderReadiness(this.config);
  }

  async classifyIntake(record: FactoryRequestRecord, now: string): Promise<IntakeClassificationOutput> {
    const fallback = () => deterministicClassification(record, this.createTrace("intake_classification", "fast", now));
    const providerResult = await this.runProviderStep({
      stepId: "intake_classification",
      profile: "fast",
      now,
      schema: classificationPayloadSchema,
      prompt: [
        "Classify this Agent Factory request for a Customer360 dashboard build.",
        "Return JSON with complexity, confidence, pii_likelihood, missing_information, inferred_source_systems, inferred_metrics, summary.",
        JSON.stringify({
          request_id: record.request.request_id,
          artifact_type: record.request.requested_artifact_type,
          request_text: record.request.request_text,
          source_systems: record.intake.source_systems,
          requested_metrics: record.intake.requested_metrics,
          constraints: record.intake.constraints
        })
      ].join("\n")
    });

    if (!providerResult.payload) {
      return replaceTrace(fallback(), withRequestId(providerResult.trace, record.request.request_id));
    }

    return IntakeClassificationOutputSchema.parse({
      output_id: `CLASS-${record.request.request_id}`,
      request_id: record.request.request_id,
      artifact_type: "dashboard_app",
      template_id: "customer360_dashboard_v1",
      ...providerResult.payload,
      trace: withRequestId(providerResult.trace, record.request.request_id)
    });
  }

  async generateRequirementsSpec(
    record: FactoryRequestRecord,
    now: string
  ): Promise<RequirementsSpecGenerationOutput> {
    const fallbackSpec = generateStructuredSpec(record, now);
    const fallback = () =>
      RequirementsSpecGenerationOutputSchema.parse({
        output_id: `REQSPEC-${record.request.request_id}`,
        request_id: record.request.request_id,
        spec: fallbackSpec,
        assumptions: [
          "Deterministic fallback used approved clarification answers and Customer360 defaults.",
          "Live model text was not used for this requirements output."
        ],
        trace: this.createTrace("requirements_spec_generation", "reasoning", now)
      });
    const providerResult = await this.runProviderStep({
      stepId: "requirements_spec_generation",
      profile: "reasoning",
      now,
      schema: requirementsPayloadSchema,
      prompt: [
        "Generate a schema-first requirements spec for a governed Customer360 dashboard build.",
        "Return JSON with business_goal, data_sources_json, metrics_json, filters_json, constraints_json, assumptions.",
        JSON.stringify({
          request_id: record.request.request_id,
          request_text: record.request.request_text,
          clarification_questions: record.clarificationQuestions.map((question) => ({
            id: question.id,
            question: question.question
          })),
          clarification_answers: record.clarificationAnswers,
          defaults: {
            owner: record.request.owner_name,
            output_type: record.request.requested_artifact_type
          }
        })
      ].join("\n")
    });

    if (!providerResult.payload) {
      return replaceTrace(fallback(), withRequestId(providerResult.trace, record.request.request_id));
    }

    const providerDataSources = providerResult.payload.data_sources_json ?? [];
    const providerMetrics = providerResult.payload.metrics_json ?? [];
    const providerFilters = providerResult.payload.filters_json ?? [];
    const providerConstraints = providerResult.payload.constraints_json ?? [];
    const spec = StructuredSpecSchema.parse({
      ...fallbackSpec,
      business_goal: providerResult.payload.business_goal,
      data_sources_json: providerDataSources.length > 0 ? providerDataSources : fallbackSpec.data_sources_json,
      metrics_json: providerMetrics.length > 0 ? providerMetrics : fallbackSpec.metrics_json,
      filters_json: providerFilters.length > 0 ? providerFilters : fallbackSpec.filters_json,
      constraints_json: providerConstraints.length > 0 ? providerConstraints : fallbackSpec.constraints_json,
      updated_at: now
    });

    return RequirementsSpecGenerationOutputSchema.parse({
      output_id: `REQSPEC-${record.request.request_id}`,
      request_id: record.request.request_id,
      spec,
      assumptions: providerResult.payload.assumptions ?? [],
      trace: withRequestId(providerResult.trace, record.request.request_id)
    });
  }

  async generateGovernance(
    record: FactoryRequestRecord,
    now: string
  ): Promise<GovernanceAgentOutput> {
    const spec = record.structuredSpec ?? generateStructuredSpec(record, now);
    const deterministic = generateGovernanceAssessment(record, spec, now);
    const fallback = () =>
      GovernanceAgentOutputSchema.parse({
        output_id: `GOVOUT-${record.request.request_id}`,
        request_id: record.request.request_id,
        assessment: deterministic.assessment,
        approval_tasks: deterministic.approvalTasks,
        trace: this.createTrace("governance_assessment", "reasoning", now)
      });
    const providerResult = await this.runProviderStep({
      stepId: "governance_assessment",
      profile: "reasoning",
      now,
      schema: governancePayloadSchema,
      prompt: [
        "Assess governance for a sandbox-only Customer360 build.",
        "Return JSON with risk_tier, pii_detected, pii_policy, forbidden_actions_json, required_approvals_json, policy_decisions_json, policy_violations_json.",
        JSON.stringify({
          request_id: record.request.request_id,
          spec: {
            business_goal: spec.business_goal,
            data_sources_json: spec.data_sources_json,
            metrics_json: spec.metrics_json,
            constraints_json: spec.constraints_json
          }
        })
      ].join("\n")
    });

    if (!providerResult.payload) {
      return replaceTrace(fallback(), withRequestId(providerResult.trace, record.request.request_id));
    }

    const providerForbiddenActions = providerResult.payload.forbidden_actions_json ?? [];
    const providerRequiredApprovals = providerResult.payload.required_approvals_json ?? [];
    const providerPolicyDecisions = providerResult.payload.policy_decisions_json ?? [];
    const assessment = GovernanceAssessmentSchema.parse({
      ...deterministic.assessment,
      risk_tier: providerResult.payload.risk_tier,
      pii_detected: providerResult.payload.pii_detected,
      pii_policy: providerResult.payload.pii_policy,
      forbidden_actions_json:
        providerForbiddenActions.length > 0 ? providerForbiddenActions : deterministic.assessment.forbidden_actions_json,
      required_approvals_json:
        providerRequiredApprovals.length > 0
          ? providerRequiredApprovals
          : deterministic.assessment.required_approvals_json,
      policy_decisions_json:
        providerPolicyDecisions.length > 0 ? providerPolicyDecisions : deterministic.assessment.policy_decisions_json,
      policy_violations_json: providerResult.payload.policy_violations_json ?? []
    });

    return GovernanceAgentOutputSchema.parse({
      output_id: `GOVOUT-${record.request.request_id}`,
      request_id: record.request.request_id,
      assessment,
      approval_tasks: deterministic.approvalTasks.map((task) => ApprovalTaskSchema.parse(task)),
      trace: withRequestId(providerResult.trace, record.request.request_id)
    });
  }

  async generateBuildPlan(record: FactoryRequestRecord, now: string): Promise<BuildPlanAgentOutput> {
    if (!record.structuredSpec || !record.governanceAssessment) {
      throw new Error("Structured spec and governance assessment are required before build planning.");
    }

    const deterministicManifest = generateBuildManifest(record, record.structuredSpec, record.governanceAssessment, now);
    const fallback = () =>
      BuildPlanAgentOutputSchema.parse({
        output_id: `PLAN-${record.request.request_id}`,
        request_id: record.request.request_id,
        manifest: deterministicManifest,
        worker_instructions: deterministicWorkerInstructions(),
        acceptance_criteria: deterministicAcceptanceCriteria(),
        trace: this.createTrace("build_plan", "code", now)
      });
    const providerResult = await this.runProviderStep({
      stepId: "build_plan",
      profile: "code",
      now,
      schema: buildPlanPayloadSchema,
      prompt: [
        "Create worker instructions for a sandbox-only Customer360 dashboard build plan.",
        "Return JSON with worker_instructions and acceptance_criteria only. Do not include secrets or user PII.",
        JSON.stringify({
          request_id: record.request.request_id,
          manifest: deterministicManifest,
          governance: {
            pii_policy: record.governanceAssessment.pii_policy,
            forbidden_actions_json: record.governanceAssessment.forbidden_actions_json
          }
        })
      ].join("\n")
    });

    if (!providerResult.payload) {
      return replaceTrace(fallback(), withRequestId(providerResult.trace, record.request.request_id));
    }

    const providerWorkerInstructions = providerResult.payload.worker_instructions ?? [];
    const providerAcceptanceCriteria = providerResult.payload.acceptance_criteria ?? [];
    return BuildPlanAgentOutputSchema.parse({
      output_id: `PLAN-${record.request.request_id}`,
      request_id: record.request.request_id,
      manifest: FactoryBuildManifestSchema.parse(deterministicManifest),
      worker_instructions:
        providerWorkerInstructions.length > 0 ? providerWorkerInstructions : deterministicWorkerInstructions(),
      acceptance_criteria:
        providerAcceptanceCriteria.length > 0 ? providerAcceptanceCriteria : deterministicAcceptanceCriteria(),
      trace: withRequestId(providerResult.trace, record.request.request_id)
    });
  }

  private async runProviderStep<T>(input: {
    stepId: AgentStepId;
    profile: AgentModelProfile;
    now: string;
    schema: z.ZodType<T>;
    prompt: string;
  }): Promise<ProviderRunResult<T>> {
    const trace = this.createTrace(input.stepId, input.profile, input.now);

    if (this.config.runtimeMode === "deterministic") {
      return {
        trace: {
          ...trace,
          mode: "deterministic-fallback",
          warnings: ["AGENT_RUNTIME_MODE=deterministic; live provider call skipped."]
        }
      };
    }

    if (!this.config.fireworks.apiKeyPresent) {
      return {
        trace: {
          ...trace,
          mode: "degraded-no-key",
          warnings: ["FIREWORKS_API_KEY is not configured; deterministic fallback output was used."]
        }
      };
    }

    try {
      const started = Date.now();
      const result = await this.client.complete({
        profile: input.profile,
        messages: [
          {
            role: "system",
            content:
              "You are an Agent Factory runtime step. Return strict JSON only. Never include secrets, emails, phone numbers, or raw customer PII."
          },
          { role: "user", content: input.prompt }
        ]
      });
      const payload = input.schema.parse(JSON.parse(result.content));

      return {
        payload,
        trace: this.completeTrace(
          {
            ...trace,
            mode: "live",
            model_id: result.model,
            usage: result.usage
          },
          Date.now() - started
        )
      };
    } catch (error) {
      return {
        trace: {
          ...trace,
          mode: "degraded-provider-error",
          warnings: [`Live provider failed validation or request handling; deterministic fallback output was used.`]
        }
      };
    }
  }

  private createTrace(stepId: AgentStepId, profile: AgentModelProfile, now: string): AgentStepTraceEnvelope {
    return {
      trace_id: `${stepId}-${Date.now()}`,
      step_id: stepId,
      provider: "fireworks",
      profile,
      model_id: this.config.fireworks.models[profile],
      mode: this.config.fireworks.apiKeyPresent ? "live" : "degraded-no-key",
      langsmith: {
        enabled: this.config.langsmith.tracingEnabled,
        project: this.config.langsmith.project,
        run_name: `agent-factory.${stepId}`,
        tags: ["agent-factory", stepId, profile],
        metadata: {
          provider: "fireworks",
          profile,
          runtime_mode: this.config.runtimeMode
        }
      },
      redaction: {
        pii_redacted: true,
        secrets_redacted: true,
        raw_prompt_stored: false,
        raw_response_stored: false
      },
      started_at: now,
      completed_at: now,
      latency_ms: 0,
      warnings: []
    };
  }

  private completeTrace(trace: AgentStepTraceEnvelope, latencyMs: number): AgentStepTraceEnvelope {
    return {
      ...trace,
      completed_at: new Date().toISOString(),
      latency_ms: latencyMs
    };
  }
}

export function createAgentRuntime(options: AgentRuntimeOptions = {}): AgentRuntime {
  return new AgentRuntime(options);
}

function replaceTrace<T extends { trace: AgentStepTraceEnvelope }>(output: T, trace: AgentStepTraceEnvelope): T {
  return {
    ...output,
    trace: {
      ...trace,
      completed_at: output.trace.completed_at,
      latency_ms: output.trace.latency_ms,
      redaction: output.trace.redaction
    }
  };
}

function withRequestId(trace: AgentStepTraceEnvelope, requestId: string): AgentStepTraceEnvelope {
  return {
    ...trace,
    request_id: requestId
  };
}

function deterministicClassification(
  record: FactoryRequestRecord,
  trace: AgentStepTraceEnvelope
): IntakeClassificationOutput {
  const normalized = [
    record.request.request_text,
    ...record.intake.source_systems,
    ...record.intake.requested_metrics,
    ...record.intake.constraints
  ]
    .join(" ")
    .toLowerCase();
  const likelyPii = /customer|crm|email|phone|name|contact|pii/.test(normalized);
  const productionIntent = /production|external network|secret|raw pii|unmasked/.test(normalized);
  const sourceSystems = record.intake.source_systems.length > 0 ? record.intake.source_systems : ["synthetic_customers_csv"];
  const metrics = record.intake.requested_metrics.length > 0 ? record.intake.requested_metrics : ["revenue"];

  return IntakeClassificationOutputSchema.parse({
    output_id: `CLASS-${record.request.request_id}`,
    request_id: record.request.request_id,
    artifact_type: "dashboard_app",
    template_id: "customer360_dashboard_v1",
    complexity: productionIntent ? "high" : likelyPii || metrics.length > 4 ? "medium" : "low",
    confidence: 0.78,
    pii_likelihood: likelyPii ? "likely" : "possible",
    missing_information: [
      sourceSystems.length === 0 ? "approved data sources" : undefined,
      metrics.length === 0 ? "required metrics" : undefined,
      "scope approval owner"
    ].filter((value): value is string => Boolean(value)),
    inferred_source_systems: sourceSystems,
    inferred_metrics: metrics,
    summary: "Customer360 dashboard request classified for governed sandbox build planning.",
    trace
  });
}

function deterministicWorkerInstructions(): string[] {
  return [
    "Generate or update only files allowed by the FactoryBuildManifest allowed_files_json list.",
    "Use sandbox Customer360 data and keep all customer names, emails, and phone numbers masked.",
    "Run package build and focused tests before reporting awaiting_release_approval.",
    "Fail closed on forbidden file paths, secret access, production deploy, or raw PII logging."
  ];
}

function deterministicAcceptanceCriteria(): string[] {
  return [
    "Customer360 dashboard renders approved metrics and required filters.",
    "PII masking policy is enforced in generated UI and logs.",
    "Build/test evidence is attached to the build run status.",
    "Sandbox deployment remains disabled until release approval."
  ];
}
