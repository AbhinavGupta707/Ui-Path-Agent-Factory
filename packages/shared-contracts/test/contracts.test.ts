import { describe, expect, it } from "vitest";
import {
  BuildManifestSchema,
  IntakeRequestSchema,
  createAuditEvent,
  defaultUiPathContext
} from "../src/index.js";

describe("shared contracts", () => {
  it("validates the baseline UiPath context", () => {
    expect(defaultUiPathContext).toMatchObject({
      organization: "galacticus",
      tenant: "DefaultTenant",
      folderName: "AgentFactoryDemo"
    });
  });

  it("accepts a complete intake request", () => {
    const request = IntakeRequestSchema.parse({
      title: "Build customer health dashboard",
      requesterEmail: "owner@example.com",
      businessGoal: "Give account teams a live renewal-risk view.",
      targetAudience: "Customer success leaders",
      sourceSystems: ["CRM", "Product analytics"],
      constraints: ["No personal contact fields in generated app"]
    });

    expect(request.sourceSystems).toContain("CRM");
  });

  it("requires acceptance criteria for build manifests", () => {
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

  it("creates audit events with timestamps", () => {
    const event = createAuditEvent({
      requestId: "req_1",
      actor: "maestro",
      action: "approval_requested",
      summary: "Governance approval requested."
    });

    expect(event.createdAt).toContain("T");
  });
});
