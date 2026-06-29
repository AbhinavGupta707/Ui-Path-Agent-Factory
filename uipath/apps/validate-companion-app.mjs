import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const contractPath = join(currentDir, "companion-app.contract.json");
const schemaPath = join(currentDir, "companion-app.schema.json");

const [contract, schema] = await Promise.all([
  readJson(contractPath),
  readJson(schemaPath)
]);

const errors = [];

assert(contract.$schema === "./companion-app.schema.json", "contract must reference the local schema");
assert(schema.title === "Agent Factory UiPath Apps companion contract", "schema title is unexpected");
assert(contract.status === "proposal-only", "contract must remain proposal-only until the app is deployed");
assert(contract.platformMode === "uipath-ready", "platformMode must be uipath-ready");
assert(contract.environment.folderName === "AgentFactoryDemo", "folderName must match checkpoint context");
assert(contract.environment.folderKey === "cba41e19-47cc-4a0a-bf73-de88b60a61be", "folderKey must match checkpoint context");
assert(contract.environment.folderId === 7986306, "folderId must match checkpoint context");
assert(contract.app.viteBase === "./", "coded app Vite base must be './'");
assert(contract.app.type === "Coded Web App", "app type must be Coded Web App");

const screenIds = new Set((contract.screens ?? []).map((screen) => screen.id));
for (const requiredScreen of ["intake", "requestStatus", "clarifications", "approvals"]) {
  assert(screenIds.has(requiredScreen), `missing screen ${requiredScreen}`);
}

const bindingEntities = new Set((contract.dataBindings ?? []).map((binding) => binding.entity));
for (const entity of ["AutomationRequest", "ApprovalTask", "BuildRun", "TestRun", "DeploymentRecord", "AuditEvent"]) {
  assert(bindingEntities.has(entity), `missing data binding for ${entity}`);
}

const setupCommands = (contract.setupPlan ?? []).map((step) => step.command).join("\n");
assert(setupCommands.includes("uip codedapp init"), "setup plan must include codedapp init");
assert(setupCommands.includes("npm install && npm run build"), "setup plan must build before packaging");
assert(setupCommands.includes("uip codedapp pack ./dist"), "setup plan must include codedapp pack");
assert(setupCommands.includes("uip codedapp publish"), "setup plan must include codedapp publish");
assert(setupCommands.includes("uip codedapp deploy"), "setup plan must include codedapp deploy");
assert(setupCommands.includes("--folder-key cba41e19-47cc-4a0a-bf73-de88b60a61be"), "deploy command must use folder key");

const liveSteps = (contract.setupPlan ?? []).filter((step) => step.mutatesLiveUiPath);
for (const step of liveSteps) {
  assert(step.requiresExplicitApproval === true, `live setup step ${step.step} must require approval`);
}

if (errors.length > 0) {
  console.error(JSON.stringify({ result: "failed", errors }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  result: "passed",
  contract: "uipath/apps/companion-app.contract.json",
  screens: [...screenIds]
}, null, 2));

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function assert(condition, message) {
  if (!condition) {
    errors.push(message);
  }
}
