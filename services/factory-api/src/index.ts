import { createServer, type IncomingHttpHeaders, type IncomingMessage, type ServerResponse } from "node:http";
import { z } from "zod";
import {
  BuildStatusUpdateSchema,
  ClarificationAnswersRequestSchema,
  CreateAutomationRequestSchema,
  IntakeRequestSchema,
  PlatformModeSchema,
  createAuditEvent,
  type AuditEvent,
  type AgentStepTraceEnvelope,
  type BuildRun
} from "@agent-factory/shared-contracts";
import { createAgentRuntime, type AgentRuntime } from "./agentRuntime.js";
import {
  approveScopeTask,
  createQueuedBuildRun,
  generateClarificationQuestions,
  mapLegacyIntakeToCreateRequest
} from "./lifecycle.js";
import { redactPayload } from "./redaction.js";
import {
  createInMemoryFactoryStore,
  type DeploymentRecord,
  type FactoryRequestRecord,
  type FactoryStore
} from "./store.js";

const BuildCreateRequestSchema = z.object({
  request_id: z.string().min(1),
  manifest_id: z.string().min(1).optional(),
  mode: z.literal("sandbox").default("sandbox")
});

const ScopeApprovalRequestSchema = z.object({
  comments: z.string().optional()
});

const ReleaseApprovalSchema = z
  .object({
    approvalId: z.string().min(1).optional(),
    status: z.enum(["pending", "approved", "changes_requested", "rejected"]).optional(),
    outcome: z.string().min(1).optional(),
    decision: z.string().min(1).optional(),
    decidedBy: z.string().min(1).optional(),
    decidedAt: z.string().datetime().optional()
  })
  .passthrough();

const DeploymentRequestSchema = z.object({
  operationId: z.string().min(1).optional(),
  requestId: z.string().min(1),
  platformMode: PlatformModeSchema.default("uipath-ready"),
  folderKey: z.string().min(1).optional(),
  folderId: z.union([z.string().min(1), z.number().int()]).optional(),
  buildRunId: z.string().min(1),
  environment: z.enum(["sandbox", "preview", "production"]).default("sandbox"),
  pullRequestUrl: z.union([z.string().url(), z.literal("")]).optional(),
  releaseApproval: ReleaseApprovalSchema,
  deploymentUrl: z.union([z.string().url(), z.literal("")]).optional(),
  deploymentProvider: z.enum(["local-sandbox", "vercel-preview"]).default("local-sandbox"),
  rollbackNotes: z.union([z.string().min(1), z.literal("")]).optional()
});

const platformMode = "local-simulated";

const defaultHandler = createFactoryRequestHandler();

export interface FactoryRequestInput {
  method: string;
  pathname: string;
  headers?: Record<string, string | undefined>;
  body?: unknown;
}

export interface FactoryResponseOutput {
  statusCode: number;
  body: unknown;
}

export function createFactoryApiServer(
  store: FactoryStore = createInMemoryFactoryStore(),
  runtime: AgentRuntime = createAgentRuntime()
) {
  const handler = createFactoryRequestHandler(store, runtime);

  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://localhost");
      const body = request.method === "POST" || request.method === "PATCH" ? await readJson(request) : undefined;
      const result = await handler({
        method: request.method ?? "GET",
        pathname: url.pathname,
        headers: normalizeHeaders(request.headers),
        body
      });
      writeJson(response, result.statusCode, result.body);
    } catch (error) {
      writeJson(response, 500, {
        error: "internal_error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}

export function createFactoryRequestHandler(
  store: FactoryStore = createInMemoryFactoryStore(),
  runtime: AgentRuntime = createAgentRuntime()
) {
  return async function handleFactoryRequestWithStore(input: FactoryRequestInput): Promise<FactoryResponseOutput> {
    try {
      return await routeFactoryRequest(store, runtime, input);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export async function handleFactoryRequest(input: FactoryRequestInput): Promise<FactoryResponseOutput> {
  return defaultHandler(input);
}

async function routeFactoryRequest(
  store: FactoryStore,
  runtime: AgentRuntime,
  input: FactoryRequestInput
): Promise<FactoryResponseOutput> {
  const method = input.method.toUpperCase();
  const parts = input.pathname.split("/").filter(Boolean);

  if (method === "OPTIONS") {
    return { statusCode: 204, body: {} };
  }

  if (method === "GET" && (input.pathname === "/health" || input.pathname === "/api/health")) {
    const requests = await store.listRequests();

    return {
      statusCode: 200,
      body: {
        ok: true,
        service: "factory-api",
        platformMode,
        requests: requests.length,
        agentProvider: runtime.getReadiness()
      }
    };
  }

  if (method === "GET" && input.pathname === "/api/provider/status") {
    return {
      statusCode: 200,
      body: {
        data: runtime.getReadiness(),
        platformMode
      }
    };
  }

  if (method === "GET" && input.pathname === "/api/requests") {
    return {
      statusCode: 200,
      body: {
        data: await store.listRequests(),
        platformMode
      }
    };
  }

  if (method === "POST" && input.pathname === "/deploy") {
    return createDeployment(store, input.body, input.headers);
  }

  if (method === "POST" && input.pathname === "/api/requests") {
    const requestInput = CreateAutomationRequestSchema.parse(input.body ?? {});
    const record = await store.createRequest(requestInput);
    await audit(store, record.request.request_id, {
      actor_type: "factory-api",
      actor_name: "Factory API",
      action: "request_created",
      summary: `Created ${record.request.request_id} and moved it to clarifying.`,
      payload_json: {
        status_transition: { from: "draft", to: "clarifying" },
        platformMode
      }
    });
    const classification = await runtime.classifyIntake(record, store.now());
    await audit(store, record.request.request_id, {
      actor_type: "uipath-agent",
      actor_name: agentActorName("Intake Classifier", classification.trace),
      action: "intake_classified",
      summary: `Classified intake as ${classification.complexity} complexity using ${classification.trace.mode}.`,
      payload_json: {
        output_id: classification.output_id,
        complexity: classification.complexity,
        confidence: classification.confidence,
        pii_likelihood: classification.pii_likelihood,
        missing_information: classification.missing_information,
        trace: summarizeTrace(classification.trace),
        platformMode
      }
    });

    return {
      statusCode: 201,
      body: {
        request_id: record.request.request_id,
        status: record.request.status,
        platformMode,
        data: record.request
      }
    };
  }

  if (method === "POST" && input.pathname === "/api/intake") {
    const legacyIntake = IntakeRequestSchema.parse(input.body ?? {});
    const record = await store.createRequest(mapLegacyIntakeToCreateRequest(legacyIntake));
    await audit(store, record.request.request_id, {
      actor_type: "factory-api",
      actor_name: "Factory API",
      action: "request_created",
      summary: `Created ${record.request.request_id} from legacy intake and moved it to clarifying.`,
      payload_json: {
        status_transition: { from: "draft", to: "clarifying" },
        platformMode
      }
    });
    const classification = await runtime.classifyIntake(record, store.now());
    await audit(store, record.request.request_id, {
      actor_type: "uipath-agent",
      actor_name: agentActorName("Intake Classifier", classification.trace),
      action: "intake_classified",
      summary: `Classified legacy intake as ${classification.complexity} complexity using ${classification.trace.mode}.`,
      payload_json: {
        output_id: classification.output_id,
        complexity: classification.complexity,
        confidence: classification.confidence,
        pii_likelihood: classification.pii_likelihood,
        missing_information: classification.missing_information,
        trace: summarizeTrace(classification.trace),
        platformMode
      }
    });

    return {
      statusCode: 201,
      body: {
        request_id: record.request.request_id,
        status: record.request.status,
        platformMode,
        data: record.request
      }
    };
  }

  if (parts[0] === "api" && parts[1] === "requests" && parts[2]) {
    return routeRequestResource(store, runtime, method, parts[2], parts[3], input.body);
  }

  if (method === "POST" && input.pathname === "/api/builds") {
    return createBuild(store, input.body);
  }

  if (parts[0] === "api" && parts[1] === "builds" && parts[2]) {
    return routeBuildResource(store, method, parts[2], parts[3], input.body);
  }

  throw new ApiError(404, "not_found", `No route for ${method} ${input.pathname}`);
}

async function routeRequestResource(
  store: FactoryStore,
  runtime: AgentRuntime,
  method: string,
  requestId: string,
  action: string | undefined,
  body: unknown
): Promise<FactoryResponseOutput> {
  if (method === "GET" && !action) {
    const detail = await store.getRequestDetail(requestId);

    if (!detail) {
      throw new ApiError(404, "request_not_found", `Request not found: ${requestId}`);
    }

    return {
      statusCode: 200,
      body: {
        data: detail,
        platformMode
      }
    };
  }

  if (method === "POST" && action === "clarify") {
    const record = await requireRecord(store, requestId);
    const questions = generateClarificationQuestions(record);
    await store.saveClarificationQuestions(requestId, questions);
    await audit(store, requestId, {
      actor_type: "uipath-agent",
      actor_name: "Clarification Agent (local)",
      action: "clarification_questions_generated",
      summary: `Generated ${questions.length} deterministic clarification questions.`,
      payload_json: { question_ids: questions.map((question) => question.id), platformMode }
    });

    return {
      statusCode: 200,
      body: {
        request_id: requestId,
        spec_id: `SPEC-${requestId}`,
        questions,
        status: record.request.status,
        platformMode
      }
    };
  }

  if (method === "POST" && action === "answers") {
    await requireRecord(store, requestId);
    const answerBody = ClarificationAnswersRequestSchema.parse(body ?? {});
    const answers = answerBody.answers.map((answer) => ({
      ...answer,
      answered_at: answer.answered_at ?? store.now()
    }));
    const record = await store.saveClarificationAnswers(requestId, answers);
    await audit(store, requestId, {
      actor_type: "user",
      actor_name: "Business User",
      action: "clarification_answers_recorded",
      summary: `Recorded ${answers.length} clarification answers.`,
      payload_json: { answer_ids: answers.map((answer) => answer.question_id), platformMode }
    });

    return {
      statusCode: 200,
      body: {
        request_id: requestId,
        answers: record.clarificationAnswers,
        status: record.request.status,
        platformMode
      }
    };
  }

  if (method === "POST" && action === "spec") {
    const record = await requireRecord(store, requestId);
    const output = await runtime.generateRequirementsSpec(record, store.now());
    const spec = output.spec;
    await store.saveStructuredSpec(requestId, spec);
    await audit(store, requestId, {
      actor_type: "uipath-agent",
      actor_name: agentActorName("Requirements Agent", output.trace),
      action: "structured_spec_generated",
      summary: `Generated structured Customer360 build spec using ${output.trace.mode}.`,
      payload_json: {
        output_id: output.output_id,
        spec_id: spec.spec_id,
        assumptions: output.assumptions,
        trace: summarizeTrace(output.trace),
        platformMode
      }
    });

    return {
      statusCode: 200,
      body: {
        data: spec,
        status: record.request.status,
        platformMode
      }
    };
  }

  if (method === "POST" && action === "govern") {
    const record = await requireRecord(store, requestId);
    const hadSpec = Boolean(record.structuredSpec);
    const specOutput = hadSpec ? undefined : await runtime.generateRequirementsSpec(record, store.now());
    const spec = record.structuredSpec ?? specOutput?.spec;

    if (!spec) {
      throw new ApiError(500, "spec_generation_failed", "Structured spec generation did not return a spec.");
    }

    await store.saveStructuredSpec(requestId, spec);
    if (!hadSpec) {
      await audit(store, requestId, {
        actor_type: "uipath-agent",
        actor_name: specOutput ? agentActorName("Requirements Agent", specOutput.trace) : "Requirements Agent",
        action: "structured_spec_generated",
        summary: `Generated structured Customer360 build spec as governance input using ${
          specOutput?.trace.mode ?? "deterministic-fallback"
        }.`,
        payload_json: {
          output_id: specOutput?.output_id,
          spec_id: spec.spec_id,
          trace: specOutput ? summarizeTrace(specOutput.trace) : undefined,
          platformMode
        }
      });
    }
    const governanceOutput = await runtime.generateGovernance(
      {
        ...record,
        structuredSpec: spec
      },
      store.now()
    );
    const { assessment } = governanceOutput;
    const approvalTasks = governanceOutput.approval_tasks;
    await store.saveGovernanceAssessment(requestId, assessment, approvalTasks);
    await audit(store, requestId, {
      actor_type: "uipath-agent",
      actor_name: agentActorName("Governance Agent", governanceOutput.trace),
      action: "governance_assessment_generated",
      summary: `Classified request as ${assessment.risk_tier} risk with ${approvalTasks.length} approval task using ${governanceOutput.trace.mode}.`,
      payload_json: {
        output_id: governanceOutput.output_id,
        assessment_id: assessment.assessment_id,
        risk_tier: assessment.risk_tier,
        required_approvals: assessment.required_approvals_json,
        trace: summarizeTrace(governanceOutput.trace),
        platformMode
      }
    });
    const updatedRecord = await transitionStatus(
      store,
      requestId,
      "awaiting_scope_approval",
      "uipath-maestro",
      "Maestro (local)",
      "Governance complete; scope/data approval is required."
    );

    return {
      statusCode: 200,
      body: {
        data: assessment,
        approvalTasks: updatedRecord.approvalTasks,
        status: updatedRecord.request.status,
        platformMode
      }
    };
  }

  if (method === "POST" && action === "approve-scope") {
    const record = await requireRecord(store, requestId);

    if (!record.governanceAssessment) {
      throw new ApiError(409, "governance_required", "Generate governance before scope approval.");
    }

    const approvalBody = ScopeApprovalRequestSchema.parse(body ?? {});
    const task = approveScopeTask(record, store.now(), approvalBody.comments);
    await store.saveApprovalTask(requestId, task);
    await audit(store, requestId, {
      actor_type: "action-center",
      actor_name: "Action Center (local)",
      action: "scope_approval_completed",
      summary: "Scope and data policy approved for sandbox build.",
      payload_json: { task_id: task.task_id, platformMode }
    });
    const updatedRecord = await transitionStatus(
      store,
      requestId,
      "approved_for_build",
      "uipath-maestro",
      "Maestro (local)",
      "Scope approved; request is approved for build."
    );

    return {
      statusCode: 200,
      body: {
        data: task,
        status: updatedRecord.request.status,
        platformMode
      }
    };
  }

  if (method === "POST" && action === "manifest") {
    const record = await requireRecord(store, requestId);

    if (record.request.status !== "approved_for_build" && record.request.status !== "manifest_created") {
      throw new ApiError(409, "approval_required", "Approve scope before creating the build manifest.");
    }

    if (!record.structuredSpec || !record.governanceAssessment) {
      throw new ApiError(409, "spec_and_governance_required", "Generate spec and governance before manifest.");
    }

    const buildPlan = await runtime.generateBuildPlan(record, store.now());
    const manifest = buildPlan.manifest;
    await store.saveBuildManifest(requestId, manifest);
    await audit(store, requestId, {
      actor_type: "uipath-agent",
      actor_name: agentActorName("Build Planner Agent", buildPlan.trace),
      action: "build_manifest_generated",
      summary: `Generated sandbox build manifest ${manifest.manifest_id} using ${buildPlan.trace.mode}.`,
      payload_json: {
        output_id: buildPlan.output_id,
        manifest_id: manifest.manifest_id,
        manifest_hash: manifest.manifest_hash,
        worker_instruction_count: buildPlan.worker_instructions.length,
        acceptance_criteria_count: buildPlan.acceptance_criteria.length,
        trace: summarizeTrace(buildPlan.trace),
        platformMode
      }
    });
    const updatedRecord = await transitionStatus(
      store,
      requestId,
      "manifest_created",
      "uipath-maestro",
      "Maestro (local)",
      "Build manifest created and ready for worker queue."
    );

    return {
      statusCode: 200,
      body: {
        data: manifest,
        status: updatedRecord.request.status,
        platformMode
      }
    };
  }

  if (method === "GET" && action === "timeline") {
    await requireRecord(store, requestId);

    return {
      statusCode: 200,
      body: {
        data: await store.listAuditEvents(requestId),
        platformMode
      }
    };
  }

  throw new ApiError(404, "not_found", `No request route for ${requestId}/${action ?? ""}`);
}

async function createBuild(store: FactoryStore, body: unknown): Promise<FactoryResponseOutput> {
  const createBody = BuildCreateRequestSchema.parse(body ?? {});
  const record = await requireRecord(store, createBody.request_id);

  if (!record.buildManifest) {
    throw new ApiError(409, "manifest_required", "Create a build manifest before queueing a build.");
  }

  if (createBody.manifest_id && createBody.manifest_id !== record.buildManifest.manifest_id) {
    throw new ApiError(400, "manifest_mismatch", "Build manifest id does not match the request manifest.");
  }

  const buildRun = createQueuedBuildRun(record, store.now());
  await store.createBuildRun(buildRun);
  await audit(store, createBody.request_id, {
    actor_type: "codex-worker",
    actor_name: "Build Worker (local queue)",
    action: "build_run_queued",
    summary: `Queued build run ${buildRun.build_run_id}.`,
    payload_json: { build_run_id: buildRun.build_run_id, manifest_id: buildRun.manifest_id, platformMode }
  });
  const updatedRecord = await transitionStatus(
    store,
    createBody.request_id,
    "build_queued",
    "uipath-maestro",
    "Maestro (local)",
    "Build worker queued from approved manifest."
  );

  return {
    statusCode: 201,
    body: {
      data: updatedRecord.buildRuns.at(-1),
      status: updatedRecord.request.status,
      platformMode
    }
  };
}

async function createDeployment(
  store: FactoryStore,
  body: unknown,
  headers: Record<string, string | undefined> | undefined
): Promise<FactoryResponseOutput> {
  const deploymentBody = DeploymentRequestSchema.parse(body ?? {});
  const headerOperationId = operationIdFromHeaders(headers);

  if (deploymentBody.operationId && headerOperationId && deploymentBody.operationId !== headerOperationId) {
    throw new ApiError(
      400,
      "operation_id_mismatch",
      "operationId must match x-agent-factory-operation-id when both are provided."
    );
  }

  const operationId = deploymentBody.operationId ?? headerOperationId;

  if (!operationId) {
    throw new ApiError(400, "operation_id_required", "Provide operationId or x-agent-factory-operation-id.");
  }

  const existingDeployment = await store.findDeploymentByOperationId(operationId);

  if (existingDeployment) {
    if (
      existingDeployment.request_id !== deploymentBody.requestId ||
      existingDeployment.build_run_id !== deploymentBody.buildRunId
    ) {
      throw new ApiError(409, "idempotency_conflict", "operationId already belongs to another deployment.");
    }

    return {
      statusCode: 200,
      body: deploymentResponse(existingDeployment, true)
    };
  }

  if (deploymentBody.environment === "production") {
    throw new ApiError(
      403,
      "production_deploy_disabled",
      "Production deployment is disabled for this demo lane; use sandbox or preview."
    );
  }

  if (!releaseApprovalAllowsDeploy(deploymentBody.releaseApproval)) {
    throw new ApiError(403, "release_approval_required", "Release approval must be approved before deployment.");
  }

  const record = await requireRecord(store, deploymentBody.requestId);
  const buildRun = record.buildRuns.find((run) => run.build_run_id === deploymentBody.buildRunId);

  if (!buildRun) {
    throw new ApiError(404, "build_not_found", `Build run not found: ${deploymentBody.buildRunId}`);
  }

  if (["build_failed", "tests_failed", "blocked", "cancelled"].includes(buildRun.status)) {
    throw new ApiError(409, "deployment_blocked", `Build run ${buildRun.build_run_id} is ${buildRun.status}.`);
  }

  if (!["awaiting_release_approval", "deploying", "deployed"].includes(buildRun.status)) {
    throw new ApiError(
      409,
      "quality_gate_required",
      `Build run ${buildRun.build_run_id} must reach awaiting_release_approval before deployment.`
    );
  }

  const pullRequestUrl =
    deploymentBody.pullRequestUrl && deploymentBody.pullRequestUrl.length > 0 ? deploymentBody.pullRequestUrl : undefined;
  const explicitDeploymentUrl =
    deploymentBody.deploymentUrl && deploymentBody.deploymentUrl.length > 0 ? deploymentBody.deploymentUrl : undefined;
  const rollbackNotes =
    deploymentBody.rollbackNotes && deploymentBody.rollbackNotes.length > 0 ? deploymentBody.rollbackNotes : undefined;
  const deploymentUrl = resolveDeploymentUrl(deploymentBody.deploymentProvider, explicitDeploymentUrl);
  const now = store.now();
  const deployment: DeploymentRecord = {
    deployment_id: `DEP-${deploymentBody.requestId}-${String(record.deploymentRecords.length + 1).padStart(3, "0")}`,
    operation_id: operationId,
    request_id: deploymentBody.requestId,
    build_run_id: deploymentBody.buildRunId,
    environment: deploymentBody.environment,
    status: "deployed",
    app_url: deploymentUrl,
    deployment_provider: deploymentBody.deploymentProvider,
    rollback_ref: buildRun.commit_sha ?? buildRun.branch_name ?? buildRun.build_run_id,
    rollback_notes:
      rollbackNotes ??
      "Sandbox-only deployment; rollback by stopping the local app or redeploying the previous preview. Production is disabled.",
    pull_request_url: pullRequestUrl,
    platformMode: deploymentBody.platformMode,
    created_at: now,
    completed_at: now
  };

  await store.createDeploymentRecord(deployment);
  await store.updateBuildRun(deploymentBody.buildRunId, {
    status: "deployed",
    pr_url: pullRequestUrl ?? buildRun.pr_url,
    logs_uri: `local://deployments/${deployment.deployment_id}`,
    completed_at: now
  });
  await audit(store, deploymentBody.requestId, {
    actor_type: "factory-api",
    actor_name: "Deployment Service (local sandbox)",
    action: "sandbox_deployment_recorded",
    summary: `Recorded ${deployment.environment} deployment evidence for ${deployment.build_run_id}.`,
    payload_json: {
      deployment_id: deployment.deployment_id,
      operation_id: operationId,
      build_run_id: deployment.build_run_id,
      environment: deployment.environment,
      status: deployment.status,
      deployment_url: deployment.app_url,
      rollback_ref: deployment.rollback_ref,
      platformMode: deployment.platformMode
    }
  });
  await transitionStatus(
    store,
    deploymentBody.requestId,
    "deployed",
    "uipath-maestro",
    "Maestro (local)",
    `Sandbox deployment evidence recorded for ${deployment.build_run_id}.`
  );

  return {
    statusCode: 201,
    body: deploymentResponse(deployment, false)
  };
}

async function routeBuildResource(
  store: FactoryStore,
  method: string,
  buildRunId: string,
  action: string | undefined,
  body: unknown
): Promise<FactoryResponseOutput> {
  if (method === "GET" && !action) {
    const buildRun = await findBuildRun(store, buildRunId);

    if (!buildRun) {
      throw new ApiError(404, "build_not_found", `Build run not found: ${buildRunId}`);
    }

    return {
      statusCode: 200,
      body: {
        data: buildRun,
        platformMode
      }
    };
  }

  if ((method === "POST" || method === "PATCH") && (!action || action === "status")) {
    const existingRun = await findBuildRun(store, buildRunId);

    if (!existingRun) {
      throw new ApiError(404, "build_not_found", `Build run not found: ${buildRunId}`);
    }

    const updateBody = BuildStatusUpdateSchema.parse(body ?? {});
    const now = store.now();
    const patch: Partial<BuildRun> = {
      ...updateBody,
      started_at: updateBody.status === "building" ? existingRun.started_at ?? now : existingRun.started_at,
      completed_at: ["build_failed", "tests_failed", "deployed", "blocked", "cancelled"].includes(updateBody.status)
        ? existingRun.completed_at ?? now
        : existingRun.completed_at
    };
    await store.updateBuildRun(buildRunId, patch);
    await audit(store, existingRun.request_id, {
      actor_type: "codex-worker",
      actor_name: updateBody.worker_id ?? "Build Worker (local)",
      action: "build_status_updated",
      summary: `Build run ${buildRunId} moved to ${updateBody.status}.`,
      payload_json: {
        build_run_id: buildRunId,
        status: updateBody.status,
        generated_files: updateBody.generated_files_json ?? [],
        platformMode
      }
    });
    const updatedRecord = await transitionStatus(
      store,
      existingRun.request_id,
      updateBody.status,
      "uipath-maestro",
      "Maestro (local)",
      `Request status mirrored from build run ${buildRunId}.`
    );

    return {
      statusCode: 200,
      body: {
        data: updatedRecord.buildRuns.find((run) => run.build_run_id === buildRunId),
        status: updatedRecord.request.status,
        platformMode
      }
    };
  }

  throw new ApiError(404, "not_found", `No build route for ${buildRunId}/${action ?? ""}`);
}

async function transitionStatus(
  store: FactoryStore,
  requestId: string,
  status: Parameters<FactoryStore["updateRequestStatus"]>[1],
  actor_type: AuditEvent["actor_type"],
  actor_name: string,
  summary: string
): Promise<FactoryRequestRecord> {
  const record = await requireRecord(store, requestId);
  const previousStatus = record.request.status;

  if (previousStatus === status) {
    return record;
  }

  const updatedRecord = await store.updateRequestStatus(requestId, status);
  await audit(store, requestId, {
    actor_type,
    actor_name,
    action: "status_changed",
    summary,
    payload_json: {
      from: previousStatus,
      to: status,
      platformMode
    }
  });
  return updatedRecord;
}

async function findBuildRun(store: FactoryStore, buildRunId: string): Promise<BuildRun | undefined> {
  const requests = await store.listRequests();

  for (const request of requests) {
    const record = await store.getRequestRecord(request.request_id);
    const buildRun = record?.buildRuns.find((run) => run.build_run_id === buildRunId);

    if (buildRun) {
      return buildRun;
    }
  }

  return undefined;
}

async function requireRecord(store: FactoryStore, requestId: string): Promise<FactoryRequestRecord> {
  const record = await store.getRequestRecord(requestId);

  if (!record) {
    throw new ApiError(404, "request_not_found", `Request not found: ${requestId}`);
  }

  return record;
}

async function audit(
  store: FactoryStore,
  requestId: string,
  event: Omit<AuditEvent, "event_id" | "request_id" | "timestamp">
): Promise<AuditEvent> {
  const redactedPayload = redactPayload(event.payload_json ?? {});

  return store.addAuditEvent(
    createAuditEvent({
      ...event,
      payload_json: {
        ...redactedPayload.value,
        redaction: redactedPayload.flags
      },
      event_id: store.nextAuditId(),
      request_id: requestId,
      timestamp: store.now()
    })
  );
}

function summarizeTrace(trace: AgentStepTraceEnvelope): Record<string, unknown> {
  return {
    trace_id: trace.trace_id,
    step_id: trace.step_id,
    provider: trace.provider,
    profile: trace.profile,
    model_id: trace.model_id,
    mode: trace.mode,
    langsmith: {
      enabled: trace.langsmith.enabled,
      project: trace.langsmith.project,
      run_name: trace.langsmith.run_name,
      tags: trace.langsmith.tags
    },
    redaction: trace.redaction,
    usage: trace.usage,
    warnings: trace.warnings
  };
}

function agentActorName(label: string, trace: AgentStepTraceEnvelope): string {
  if (trace.mode === "live") {
    return `${label} (Fireworks live)`;
  }

  if (trace.mode === "degraded-no-key") {
    return `${label} (degraded: no provider key)`;
  }

  if (trace.mode === "degraded-provider-error") {
    return `${label} (degraded: provider error)`;
  }

  return `${label} (deterministic fallback)`;
}

function releaseApprovalAllowsDeploy(approval: z.infer<typeof ReleaseApprovalSchema>): boolean {
  const marker = (approval.status ?? approval.outcome ?? approval.decision ?? "").toLowerCase().replace(/[\s-]+/g, "_");

  if (!marker) {
    return true;
  }

  return ["approved", "approve_sandbox_deploy", "approved_for_sandbox", "sandbox_approved"].includes(marker);
}

function resolveDeploymentUrl(
  provider: z.infer<typeof DeploymentRequestSchema>["deploymentProvider"],
  explicitUrl: string | undefined
): string {
  if (provider === "vercel-preview" && !explicitUrl) {
    throw new ApiError(400, "deployment_url_required", "Vercel preview deployments must provide deploymentUrl.");
  }

  return (
    explicitUrl ??
    process.env.CUSTOMER360_DEPLOYMENT_URL ??
    process.env.CUSTOMER360_TEMPLATE_URL ??
    "http://localhost:5174"
  );
}

function deploymentResponse(deployment: DeploymentRecord, idempotentReplay: boolean): Record<string, unknown> {
  return {
    deployment_id: deployment.deployment_id,
    deploymentId: deployment.deployment_id,
    operationId: deployment.operation_id,
    request_id: deployment.request_id,
    requestId: deployment.request_id,
    build_run_id: deployment.build_run_id,
    buildRunId: deployment.build_run_id,
    environment: deployment.environment,
    status: deployment.status,
    deploymentStatus: deployment.status,
    deploymentUrl: deployment.app_url,
    app_url: deployment.app_url,
    deploymentProvider: deployment.deployment_provider,
    pullRequestUrl: deployment.pull_request_url,
    rollback_ref: deployment.rollback_ref,
    rollbackNotes: deployment.rollback_notes,
    rollback_notes: deployment.rollback_notes,
    platformMode: deployment.platformMode,
    idempotentReplay
  };
}

function operationIdFromHeaders(headers: Record<string, string | undefined> | undefined): string | undefined {
  return headers?.["x-agent-factory-operation-id"];
}

function normalizeHeaders(headers: IncomingHttpHeaders): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [
      name.toLowerCase(),
      Array.isArray(value) ? value.join(",") : value
    ])
  );
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody.length > 0 ? JSON.parse(rawBody) : {};
}

function writeJson(response: ServerResponse, statusCode: number, body: unknown) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
    "access-control-allow-headers": "content-type,x-agent-factory-operation-id"
  });
  response.end(statusCode === 204 ? "" : JSON.stringify(body));
}

function errorResponse(error: unknown): FactoryResponseOutput {
  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      body: {
        error: error.code,
        message: error.message
      }
    };
  }

  if (error instanceof z.ZodError) {
    return {
      statusCode: 400,
      body: {
        error: "validation_error",
        message: "Request body did not match the Factory API contract.",
        issues: error.issues
      }
    };
  }

  return {
    statusCode: 500,
    body: {
      error: "internal_error",
      message: error instanceof Error ? error.message : "Unknown error"
    }
  };
}

class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}
