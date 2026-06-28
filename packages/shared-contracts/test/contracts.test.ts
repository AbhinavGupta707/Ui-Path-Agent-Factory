import { describe, expect, it } from "vitest";
import {
  BuildManifestSchema,
  CreateAutomationRequestSchema,
  FactoryBuildManifestSchema,
  GovernanceAssessmentSchema,
  automationRequestStatuses,
  createAuditEvent,
  defaultUiPathContext
} from "../src/index.js";

describe("shared contracts", () => {
  it("validates the baseline UiPath context", () => {
    expect(defaultUiPathContext).toMatchObject({
      organization: "galacticus",
      tenant: "DefaultTenant",
      folderName: "AgentFactoryDemo",
      folderKey: "cba41e19-47cc-4a0a-bf73-de88b60a61be",
      folderId: "7986306"
    });
  });

  it("uses the checkpoint status model", () => {
    expect(automationRequestStatuses).toContain("clarifying");
    expect(automationRequestStatuses).toContain("awaiting_scope_approval");
    expect(automationRequestStatuses).toContain("manifest_created");
    expect(automationRequestStatuses).not.toContain("needs_clarification");
  });

  it("accepts a production-shaped intake request", () => {
    const request = CreateAutomationRequestSchema.parse({
      requester_name: "Avery Morgan",
      requester_email: "avery@example.com",
      request_text: "I need a governed Customer360 analytics dashboard for revenue operations.",
      owner_name: "Revenue Ops",
      owner_email: "revops@example.com"
    });

    expect(request.template_id).toBe("customer360_dashboard_v1");
    expect(request.source_systems).toContain("synthetic_customers_csv");
  });

  it("validates governance assessments with local platform mode", () => {
    const assessment = GovernanceAssessmentSchema.parse({
      assessment_id: "GOV-REQ-2026-001",
      request_id: "REQ-2026-001",
      risk_tier: "medium",
      pii_detected: true,
      pii_policy: "mask_email_name_phone",
      forbidden_actions_json: ["production_deploy"],
      required_approvals_json: ["scope_data_approval"],
      policy_decisions_json: ["Mask PII before release."],
      created_at: "2026-06-28T10:00:00.000Z"
    });

    expect(assessment.platformMode).toBe("local-simulated");
  });

  it("validates the Factory API build manifest contract", () => {
    const manifest = FactoryBuildManifestSchema.parse({
      manifest_id: "MAN-REQ-2026-001",
      request_id: "REQ-2026-001",
      manifest_hash: "abcdef1234567890",
      template_id: "customer360_dashboard_v1",
      artifact_type: "dashboard_app",
      allowed_files_json: ["src/**"],
      approved_data_sources_json: ["synthetic_customers_csv"],
      approved_metrics_json: ["revenue"],
      required_filters_json: ["date_range"],
      pii_policy: "mask_email_name_phone",
      forbidden_actions_json: ["secret_access"],
      output_targets_json: ["dashboard_app"],
      max_repair_attempts: 1,
      sandbox_only: true,
      created_at: "2026-06-28T10:00:00.000Z"
    });

    expect(manifest.sandbox_only).toBe(true);
  });

  it("retains the worker-facing build manifest contract", () => {
    expect(() =>
      BuildManifestSchema.parse({
        requestId: "req_1",
        template: "customer360-dashboard",
        branchName: "factory/req-1",
        outputApp: "apps/customer360-template",
        acceptanceCriteria: []
      })
    ).toThrow();
  });

  it("creates audit events with timestamps and payloads", () => {
    const event = createAuditEvent({
      event_id: "AUD-0001",
      request_id: "REQ-2026-001",
      actor_type: "uipath-maestro",
      actor_name: "Maestro (local)",
      action: "status_changed",
      summary: "Governance approval requested.",
      payload_json: { to: "awaiting_scope_approval" },
      timestamp: "2026-06-28T10:00:00.000Z"
    });

    expect(event.payload_json).toMatchObject({ to: "awaiting_scope_approval" });
  });
});
