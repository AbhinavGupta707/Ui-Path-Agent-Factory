import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BuildManifestSchema } from "@agent-factory/shared-contracts";
import { describe, expect, it } from "vitest";

const fixtureDir = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(fixtureDir, "../fixtures/customer360-valid-manifest.json");

const approvedTemplates = new Set(["customer360-dashboard"]);
const generatedOutputRoots = new Set(["dist", "build", "coverage", ".uipath", ".agents"]);
const blockedSegments = new Set([".env", "node_modules"]);

async function readFixtureManifest(): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(manifestPath, "utf8")) as Record<string, unknown>;
}

function normalizeWorkspacePath(candidate: string): string | null {
  if (!candidate || candidate.includes("\0") || candidate.startsWith("/") || /^[A-Za-z]:[\\/]/.test(candidate)) {
    return null;
  }

  const normalized = path.posix.normalize(candidate.replaceAll("\\", "/"));
  if (normalized === "." || normalized === ".." || normalized.startsWith("../")) {
    return null;
  }

  const segments = normalized.split("/");
  if (segments.some((segment) => segment === "." || segment === ".." || segment.length === 0)) {
    return null;
  }

  if (segments.some((segment) => blockedSegments.has(segment))) {
    return null;
  }

  if (generatedOutputRoots.has(segments[0] ?? "")) {
    return null;
  }

  return normalized;
}

function isAllowedCustomer360File(candidate: string): boolean {
  const normalized = normalizeWorkspacePath(candidate);
  if (!normalized) {
    return false;
  }

  return (
    normalized.startsWith("src/") ||
    normalized.startsWith("test/") ||
    normalized.startsWith("tests/") ||
    normalized.startsWith("public/data/") ||
    normalized === "README.md" ||
    normalized === "deployment.json" ||
    normalized === "package.json"
  );
}

function validateWorkerManifest(payload: Record<string, unknown>): { ok: true } | { ok: false; issues: string[] } {
  const issues: string[] = [];
  const parsed = BuildManifestSchema.safeParse(payload);

  if (!parsed.success) {
    issues.push(...parsed.error.issues.map((issue) => issue.path.join(".") || issue.message));
  } else if (!approvedTemplates.has(parsed.data.template)) {
    issues.push("template is not approved");
  }

  const allowedFiles = payload.allowedFiles;
  if (!Array.isArray(allowedFiles) || allowedFiles.some((entry) => typeof entry !== "string")) {
    issues.push("allowedFiles must be a string array");
  } else {
    const unsafeFiles = allowedFiles.filter((entry) => !isAllowedCustomer360File(entry));
    issues.push(...unsafeFiles.map((entry) => `unsafe allowed file: ${entry}`));
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}

describe("build-worker manifest guardrails", () => {
  it("accepts the canonical Customer360 manifest fixture", async () => {
    const manifest = await readFixtureManifest();

    expect(validateWorkerManifest(manifest)).toEqual({ ok: true });
    expect(BuildManifestSchema.parse(manifest).template).toBe("customer360-dashboard");
  });

  it.each(["expense-report-dashboard", "customer360-dashboard-v2", "freeform-app"])(
    "rejects disallowed template %s before runtime execution",
    async (template) => {
      const manifest = await readFixtureManifest();

      expect(validateWorkerManifest({ ...manifest, template })).toMatchObject({
        ok: false
      });
    }
  );

  it.each([
    "../README.md",
    "src/../../package.json",
    "/tmp/customer360.ts",
    "C:\\temp\\customer360.ts",
    ".env",
    "src/.env",
    "node_modules/vite/index.js",
    "dist/index.js",
    "build/static/app.js",
    ".uipath/.skills/skill.json",
    ".agents/skills/local.json",
    "templates/freeform-app/index.ts"
  ])("rejects unsafe workspace file boundary %s", (candidate) => {
    expect(isAllowedCustomer360File(candidate)).toBe(false);
  });

  it.each([
    "src/main.tsx",
    "src/features/segments.ts",
    "tests/dashboard.test.tsx",
    "test/guardrail.test.ts",
    "public/data/customer360-current.json",
    "README.md",
    "deployment.json",
    "package.json"
  ])("accepts approved Customer360 workspace file %s", (candidate) => {
    expect(isAllowedCustomer360File(candidate)).toBe(true);
  });

  it("reports every unsafe allowed file in one validation result", async () => {
    const manifest = await readFixtureManifest();
    const result = validateWorkerManifest({
      ...manifest,
      allowedFiles: ["src/main.tsx", "../escape.ts", "node_modules/pkg/index.js", "dist/app.js"]
    });

    expect(result).toEqual({
      ok: false,
      issues: [
        "unsafe allowed file: ../escape.ts",
        "unsafe allowed file: node_modules/pkg/index.js",
        "unsafe allowed file: dist/app.js"
      ]
    });
  });
});
