import { describe, expect, it } from "vitest";
import { handleFactoryRequest } from "../src/index.js";

describe("factory api", () => {
  it("responds to health checks", async () => {
    const response = await handleFactoryRequest({
      method: "GET",
      pathname: "/health"
    });
    const body = response.body as { ok: boolean };

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
  });

  it("creates intake requests", async () => {
    const response = await handleFactoryRequest({
      method: "POST",
      pathname: "/api/intake",
      body: {
        title: "Build customer health dashboard",
        requesterEmail: "owner@example.com",
        businessGoal: "Give customer success leaders a renewal-risk cockpit.",
        targetAudience: "Customer success leaders",
        sourceSystems: ["CRM", "Product analytics"]
      }
    });

    const body = response.body as { data: { id: string; status: string } };

    expect(response.statusCode).toBe(201);
    expect(body.data.id).toMatch(/^req_/);
    expect(body.data.status).toBe("needs_clarification");
  });
});
