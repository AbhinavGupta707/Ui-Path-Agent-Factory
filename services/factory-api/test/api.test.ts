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
    const actions = (timeline.body as { data: Array<{ action: string }> }).data.map((event) => event.action);

    expect(actions).toContain("request_created");
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
});
