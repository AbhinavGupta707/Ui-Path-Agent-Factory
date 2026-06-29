import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const contractPath = join(currentDir, "approval-contracts.json");
const schemaPath = join(currentDir, "approval-contracts.schema.json");

const [contract, schema] = await Promise.all([
  readJson(contractPath),
  readJson(schemaPath)
]);

const errors = [];

assert(contract.$schema === "./approval-contracts.schema.json", "contract must reference the local schema");
assert(schema.title === "Agent Factory Action Center approval contracts", "schema title is unexpected");
assert(contract.status === "proposal-only", "contract status must stay proposal-only until live tasks exist");
assert(contract.platformMode === "uipath-ready", "contract platformMode must be uipath-ready");
assert(contract.environment.folderName === "AgentFactoryDemo", "folderName must match checkpoint context");
assert(contract.environment.folderKey === "cba41e19-47cc-4a0a-bf73-de88b60a61be", "folderKey must match checkpoint context");
assert(contract.environment.folderId === 7986306, "folderId must match checkpoint context");

const approvalTypes = contract.approvalTypes ?? [];
assert(approvalTypes.length === 2, "exactly two approval types are expected");
assert(
  approvalTypes.map((approval) => approval.approvalType).sort().join(",") === "release,scope",
  "approval types must be scope and release"
);

for (const approval of approvalTypes) {
  const label = approval.approvalType ?? "unknown";
  assert(Array.isArray(approval.reviewerVisibleFields) && approval.reviewerVisibleFields.length >= 5, `${label} needs reviewer-visible fields`);
  assert(Array.isArray(approval.decisionFormFields) && approval.decisionFormFields.some((field) => field.field === "decision"), `${label} needs a decision field`);
  assertDecisionCoverage(label, approval.outcomes);
  assertMirrorCoverage(label, approval.dataServiceMirror);
  assert(Array.isArray(approval.maestroTransitions) && approval.maestroTransitions.length >= 3, `${label} needs Maestro transitions`);
  assert(approval.sampleTaskPayload?.approvalType === label, `${label} sample task payload type mismatch`);
  assert(approval.sampleDecisionPayload?.approvalType === label, `${label} sample decision payload type mismatch`);
  assert(approval.requiredDecisionPayload?.required?.includes("approvalId"), `${label} decision payload must require approvalId`);
  assert(approval.requiredDecisionPayload?.required?.includes("decision"), `${label} decision payload must require decision`);
}

if (errors.length > 0) {
  console.error(JSON.stringify({ result: "failed", errors }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  result: "passed",
  contract: "uipath/action-center/approval-contracts.json",
  approvalTypes: approvalTypes.map((approval) => approval.approvalType)
}, null, 2));

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function assert(condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

function assertDecisionCoverage(label, outcomes = []) {
  const decisions = new Set(outcomes.map((outcome) => outcome.decision));
  for (const decision of ["approved", "rejected", "changes_requested", "cancelled", "expired"]) {
    assert(decisions.has(decision), `${label} outcome missing ${decision}`);
  }
}

function assertMirrorCoverage(label, mirror = []) {
  const entities = new Set(mirror.map((entry) => entry.entity));
  for (const entity of ["ApprovalTask", "AutomationRequest", "AuditEvent"]) {
    assert(entities.has(entity), `${label} Data Service mirror missing ${entity}`);
  }
}
