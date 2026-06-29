import { describe, expect, it } from "vitest";
import { createFactoryRequestHandler } from "../src/index.js";
import { createInMemoryFactoryStore } from "../src/store.js";

function createTestHandler() {
  const store = createInMemoryFactoryStore({
    now: () => "2026-06-28T10:00:00.000Z"
  });

  return createFactoryRequestHandler(store);
}

const intakeBody = {
  requester_name: "Avery Morgan",
  requester_email: "avery@example.com",
  request_text: "I need a governed Customer360 analytics dashboard for revenue operations.",
  owner_name: "Revenue Ops",
  owner_email: "revops@example.com"
};

async function createDeployableBuild(handle: ReturnType<typeof createTestHandler>) {
  const created = await handle({
    method: "POST",
    pathname: "/api/requests",
    body: intakeBody
  });
  const requestId = (created.body as { request_id: string }).request_id;

  const clarified = await handle({
    method: "POST",
    pathname: `/api/requests/${requestId}/clarify`
  });
  const clarificationBody = clarified.body as { questions: Array<{ id: string; default: string }> };

  await handle({
    method: "POST",
    pathname: `/api/requests/${requestId}/answers`,
    body: {
      answers: clarificationBody.questions.map((question) => ({
        question_id: question.id,
        answer: question.default,
        answered_by: "Avery Morgan"
      }))
    }
  });
  await handle({
    method: "POST",
    pathname: `/api/requests/${requestId}/spec`
  });
  await handle({
    method: "POST",
    pathname: `/api/requests/${requestId}/govern`
  });
  await handle({
    method: "POST",
    pathname: `/api/requests/${requestId}/approve-scope`,
    body: { comments: "Approved for sandbox build." }
  });
  const manifest = await handle({
    method: "POST",
    pathname: `/api/requests/${requestId}/manifest`
  });
  const manifestId = (manifest.body as { data: { manifest_id: string } }).data.manifest_id;
  const queued = await handle({
    method: "POST",
    pathname: "/api/builds",
    body: {
      request_id: requestId,
      manifest_id: manifestId,
      mode: "sandbox"
    }
  });
  const buildRunId = (queued.body as { data: { build_run_id: string } }).data.build_run_id;

  await handle({
    method: "PATCH",
    pathname: `/api/builds/${buildRunId}/status`,
    body: {
      status: "awaiting_release_approval",
      worker_id: "local-worker-1",
      pr_url: "https://example.invalid/pr/123",
      generated_files_json: ["apps/customer360-template/src/App.tsx"]
    }
  });

  return { requestId, buildRunId };
}

describe("factory api", () => {
  it("responds to health checks", async () => {
    const handle = createTestHandler();
    const response = await handle({
      method: "GET",
      pathname: "/health"
    });
    const body = response.body as { ok: boolean; platformMode: string };

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.platformMode).toBe("local-simulated");
  });

  it("exposes safe degraded provider status without secrets", async () => {
    const handle = createTestHandler();
    const response = await handle({
      method: "GET",
      pathname: "/api/provider/status"
    });
    const body = response.body as {
      data: {
        provider: string;
        liveReady: boolean;
        degraded: boolean;
        missing: string[];
        modelProfiles: Record<string, string>;
      };
    };

    expect(response.statusCode).toBe(200);
    expect(body.data.provider).toBe("fireworks");
    expect(body.data.liveReady).toBe(false);
    expect(body.data.degraded).toBe(true);
    expect(body.data.missing).toContain("FIREWORKS_API_KEY");
    expect(JSON.stringify(body)).not.toContain("API_KEY=");
    expect(body.data.modelProfiles.fast).toContain("accounts/fireworks/models/");
  });

  it("creates production-shaped intake requests", async () => {
    const handle = createTestHandler();
    const response = await handle({
      method: "POST",
      pathname: "/api/requests",
      body: intakeBody
    });

    const body = response.body as { request_id: string; status: string };

    expect(response.statusCode).toBe(201);
    expect(body.request_id).toBe("REQ-2026-001");
    expect(body.status).toBe("clarifying");
  });

  it("supports the full local request lifecycle", async () => {
    const handle = createTestHandler();
    const created = await handle({
      method: "POST",
      pathname: "/api/requests",
      body: intakeBody
    });
    const requestId = (created.body as { request_id: string }).request_id;

    const clarified = await handle({
      method: "POST",
      pathname: `/api/requests/${requestId}/clarify`
    });
    const clarificationBody = clarified.body as { questions: Array<{ id: string; default: string }> };
    expect(clarificationBody.questions.map((question) => question.id)).toContain("pii_policy");

    const answers = await handle({
      method: "POST",
      pathname: `/api/requests/${requestId}/answers`,
      body: {
        answers: clarificationBody.questions.map((question) => ({
          question_id: question.id,
          answer: question.default,
          answered_by: "Avery Morgan"
        }))
      }
    });
    expect(answers.statusCode).toBe(200);

    const spec = await handle({
      method: "POST",
      pathname: `/api/requests/${requestId}/spec`
    });
    expect((spec.body as { data: { spec_id: string } }).data.spec_id).toBe(`SPEC-${requestId}`);

    const governed = await handle({
      method: "POST",
      pathname: `/api/requests/${requestId}/govern`
    });
    const governanceBody = governed.body as { data: { risk_tier: string }; status: string };
    expect(governanceBody.data.risk_tier).toBe("medium");
    expect(governanceBody.status).toBe("awaiting_scope_approval");

    const approved = await handle({
      method: "POST",
      pathname: `/api/requests/${requestId}/approve-scope`,
      body: { comments: "Approved for sandbox build." }
    });
    expect((approved.body as { status: string }).status).toBe("approved_for_build");

    const manifest = await handle({
      method: "POST",
      pathname: `/api/requests/${requestId}/manifest`
    });
    const manifestBody = manifest.body as { data: { manifest_id: string; sandbox_only: boolean }; status: string };
    expect(manifestBody.status).toBe("manifest_created");
    expect(manifestBody.data.sandbox_only).toBe(true);

    const queued = await handle({
      method: "POST",
      pathname: "/api/builds",
      body: {
        request_id: requestId,
        manifest_id: manifestBody.data.manifest_id,
        mode: "sandbox"
      }
    });
    const buildRunId = (queued.body as { data: { build_run_id: string }; status: string }).data.build_run_id;
    expect((queued.body as { status: string }).status).toBe("build_queued");

    const building = await handle({
      method: "POST",
      pathname: `/api/builds/${buildRunId}/status`,
      body: {
        status: "building",
        worker_id: "local-worker-1",
        generated_files_json: ["src/App.tsx"]
      }
    });
    expect((building.body as { status: string }).status).toBe("building");

    const timeline = await handle({
      method: "GET",
      pathname: `/api/requests/${requestId}/timeline`
    });
    const events = (timeline.body as { data: Array<{ action: string; payload_json?: Record<string, unknown> }> }).data;
    const actions = events.map((event) => event.action);
    const classificationEvent = events.find((event) => event.action === "intake_classified");

    expect(actions).toContain("request_created");
    expect(classificationEvent?.payload_json).toMatchObject({
      complexity: "medium",
      trace: {
        provider: "fireworks",
        profile: "fast",
        mode: "degraded-no-key"
      }
    });
    expect(actions).toContain("clarification_questions_generated");
    expect(actions).toContain("structured_spec_generated");
    expect(actions).toContain("governance_assessment_generated");
    expect(actions).toContain("build_manifest_generated");
    expect(actions).toContain("build_run_queued");
    expect(actions.filter((action) => action === "status_changed").length).toBeGreaterThanOrEqual(4);
  });

  it("rejects manifest creation before scope approval", async () => {
    const handle = createTestHandler();
    const created = await handle({
      method: "POST",
      pathname: "/api/requests",
      body: intakeBody
    });
    const requestId = (created.body as { request_id: string }).request_id;

    const response = await handle({
      method: "POST",
      pathname: `/api/requests/${requestId}/manifest`
    });

    expect(response.statusCode).toBe(409);
    expect((response.body as { error: string }).error).toBe("approval_required");
  });

  it("records sandbox deployment evidence and replays idempotent operation ids", async () => {
    const handle = createTestHandler();
    const { requestId, buildRunId } = await createDeployableBuild(handle);
    const deployPayload = {
      requestId,
      platformMode: "uipath-ready",
      buildRunId,
      environment: "sandbox",
      pullRequestUrl: "https://example.invalid/pr/123",
      deploymentUrl: "",
      rollbackNotes: "",
      releaseApproval: {
        approvalId: "appr_req_123_release_001",
        status: "approved",
        decidedBy: "release-approver"
      }
    };

    const deployed = await handle({
      method: "POST",
      pathname: "/deploy",
      headers: {
        "x-agent-factory-operation-id": "deploy_req_123_001"
      },
      body: deployPayload
    });
    const deployedBody = deployed.body as {
      deploymentId: string;
      deploymentStatus: string;
      deploymentUrl: string;
      platformMode: string;
      idempotentReplay: boolean;
    };

    expect(deployed.statusCode).toBe(201);
    expect(deployedBody.deploymentStatus).toBe("deployed");
    expect(deployedBody.deploymentUrl).toBe("http://localhost:5184");
    expect(deployedBody.platformMode).toBe("uipath-ready");
    expect(deployedBody.idempotentReplay).toBe(false);

    const replay = await handle({
      method: "POST",
      pathname: "/deploy",
      headers: {
        "x-agent-factory-operation-id": "deploy_req_123_001"
      },
      body: deployPayload
    });
    const replayBody = replay.body as { deploymentId: string; idempotentReplay: boolean };

    expect(replay.statusCode).toBe(200);
    expect(replayBody.deploymentId).toBe(deployedBody.deploymentId);
    expect(replayBody.idempotentReplay).toBe(true);

    const buildStatus = await handle({
      method: "GET",
      pathname: `/api/builds/${buildRunId}`
    });
    expect((buildStatus.body as { data: { status: string } }).data.status).toBe("deployed");

    const timeline = await handle({
      method: "GET",
      pathname: `/api/requests/${requestId}/timeline`
    });
    const actions = (timeline.body as { data: Array<{ action: string }> }).data.map((event) => event.action);
    expect(actions).toContain("sandbox_deployment_recorded");
  });

  it("keeps production deployment disabled", async () => {
    const handle = createTestHandler();

    const response = await handle({
      method: "POST",
      pathname: "/deploy",
      body: {
        operationId: "deploy_prod_001",
        requestId: "REQ-2026-001",
        buildRunId: "BUILD-REQ-2026-001-001",
        environment: "production",
        releaseApproval: {
          status: "approved"
        }
      }
    });

    expect(response.statusCode).toBe(403);
    expect((response.body as { error: string }).error).toBe("production_deploy_disabled");
  });
});
