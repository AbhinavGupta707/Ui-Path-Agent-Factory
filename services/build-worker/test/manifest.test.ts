import { describe, expect, it } from "vitest";
import { ManifestValidationError, normalizeBuildManifestPayload } from "../src/index.js";

describe("build manifest normalization", () => {
  it("accepts a safe Factory manifest projection and downgrades live claims to uipath-ready", () => {
    const request = normalizeBuildManifestPayload({
      operationId: "build_req_001",
      requestId: "REQ-2026-001",
      platformMode: "uipath-live",
      manifest: {
        template_id: "customer360_dashboard_v1",
        sandbox_only: true,
        pii_policy: "mask_email_name_phone"
      }
    });

    expect(request.operationId).toBe("build_req_001");
    expect(request.platformMode).toBe("uipath-ready");
    expect(request.manifest.requestId).toBe("REQ-2026-001");
    expect(request.manifest.templateId).toBe("customer360_dashboard_v1");
    expect(request.manifest.allowedFiles).toContain("src/**");
    expect(request.manifest.sandboxOnly).toBe(true);
  });

  it("accepts the legacy worker-facing BuildManifest contract", () => {
    const request = normalizeBuildManifestPayload({
      requestId: "REQ-2026-002",
      template: "customer360-dashboard",
      branchName: "codex/req-2026-002",
      outputApp: "apps/generated-customer360-template",
      acceptanceCriteria: ["Dashboard builds"],
      permissions: []
    });

    expect(request.manifest.requestId).toBe("REQ-2026-002");
    expect(request.manifest.branchName).toBe("codex/req-2026-002");
    expect(request.manifest.maxRepairAttempts).toBe(1);
  });

  it("rejects unsafe file boundaries before runtime execution", () => {
    expect(() =>
      normalizeBuildManifestPayload({
        requestId: "REQ-2026-003",
        manifest: {
          template_id: "customer360_dashboard_v1",
          sandbox_only: true,
          allowed_files_json: ["src/**", "../.env"]
        }
      })
    ).toThrow(ManifestValidationError);
  });

  it("rejects non-sandbox builds", () => {
    expect(() =>
      normalizeBuildManifestPayload({
        requestId: "REQ-2026-004",
        mode: "production",
        manifest: {
          template_id: "customer360_dashboard_v1",
          sandbox_only: true
        }
      })
    ).toThrow(ManifestValidationError);
  });
});
