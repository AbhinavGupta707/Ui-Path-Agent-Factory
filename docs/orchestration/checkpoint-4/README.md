# Checkpoint 4 - UiPath Platform Integration

## Goal

Make UiPath visibly and functionally orchestrate the Governed Agentic Automation Factory. After this checkpoint, the project should move from `uipath-ready` contracts to live or import-ready UiPath assets for Maestro, Data Service, Agents, API Workflows, Action Center, Apps, and Test Manager/Test Cloud.

Checkpoint 4 should prove that UiPath is the control plane: Data Service stores lifecycle state, Maestro owns the process, Agents and API Workflows perform deterministic steps, Action Center gates human decisions, and Test Manager/Test Cloud records quality evidence when available.

## Baseline

- Integration branch: `main`
- Launch base commit: recorded in [status.md](./status.md) after worker launch.
- Checkpoint 1, Checkpoint 2, and Checkpoint 3 are merged, pushed, and verified.
- Local smoke baseline passed before launch with `npm run smoke`.
- UiPath CLI version at launch: `1.195.1`.
- UiPath context: `galacticus / DefaultTenant / AgentFactoryDemo`.

## Readiness Snapshot

Latest discovery before launch:

| Capability | Discovery result |
|---|---|
| Auth | `uip login status --output json` succeeded for `galacticus / DefaultTenant`. |
| Folder | `uip or folders get AgentFactoryDemo --output json` returned folder id `7986306` and key `cba41e19-47cc-4a0a-bf73-de88b60a61be`. |
| Tools | `solution`, `agent`, `codedagent`, `codedapp`, `is`, `or`, `resource`, `api-workflow`, `maestro`, `df`, `tasks`, and `tm` tools are installed. |
| Data Service | `uip df entities list --native-only --output json` succeeded with no native entities. |
| Maestro | BPMN/process list commands succeeded with no processes. |
| Agents | `uip agent list --output json` succeeded with no solutions. |
| Integration Service | GitHub connector is discoverable but inactive, and `uip is connections list --output json` found no connections. |
| Action Center | Folder-scoped task list succeeded with no tasks. |
| Test Manager | CLI surface probe succeeded and project list returned no projects. |
| Coded Apps | `uip codedapp --help --output json` succeeded. |

## Lanes

### 1. Maestro And Data Service

- Prompt: [checkpoint-4-maestro-data-service.md](../worker-prompts/checkpoint-4-maestro-data-service.md)
- Owns: `uipath/maestro/**`, `uipath/data-service/**`, `docs/maestro-bpmn.md`, `docs/data-service-schema.md`, and targeted setup notes.
- Produces: import-ready or live-created Data Service schema, Maestro BPMN/process source, process status mapping, record seeding guidance, and verification evidence.

### 2. Agents And API Workflow

- Prompt: [checkpoint-4-agents-api-workflow.md](../worker-prompts/checkpoint-4-agents-api-workflow.md)
- Owns: `uipath/agents/**`, `uipath/api-workflows/**`, `docs/api-workflow-contract.md`, and targeted agent/API workflow docs.
- Produces: Requirements/Governance/Planner/Test Summary agent assets or setup instructions, API Workflow JSON assets/contracts, local worker call mapping, and validation evidence.

### 3. Apps And Action Center

- Prompt: [checkpoint-4-apps-action-center.md](../worker-prompts/checkpoint-4-apps-action-center.md)
- Owns: `uipath/apps/**`, `uipath/action-center/**`, `docs/action-center-approvals.md`, and targeted UiPath Apps/Action Center docs.
- Produces: intake/status companion app plan or coded app scaffold when practical, Action Center approval task contracts, task deep-link/runbook guidance, and live task discovery evidence.

### 4. Test Cloud And Quality Gates

- Prompt: [checkpoint-4-test-cloud.md](../worker-prompts/checkpoint-4-test-cloud.md)
- Owns: `uipath/test-cloud/**`, `docs/test-cloud-quality-gates.md`, and targeted quality-gate docs/scripts if needed.
- Produces: Test Manager/Test Cloud project/test case/test set setup or live-created assets when available, local test evidence mapping, and honest fallback if no live Test Cloud path is enabled.

## Merge Order

1. Maestro And Data Service.
2. Agents And API Workflow.
3. Apps And Action Center.
4. Test Cloud And Quality Gates.
5. Orchestrator integration patch for cross-lane contracts, status docs, and demo smoke.

## Live Mutation Policy

- Discovery/list/help commands are allowed.
- Non-destructive create operations may be prepared by workers when the lane owns the asset and the asset is absent.
- Do not delete, overwrite, rename, or update existing live UiPath assets without explicit user approval.
- Data Service entity or field creation must follow the `uipath-data-fabric` schema proposal rule: render the exact proposed schema and wait for explicit approval before running schema-altering `uip df entities create` or `update`.
- API Workflow runtime execution with auth requires explicit user approval because vendor or HTTP calls can have real side effects.
- Action Center task completion requires explicit user approval.
- Label assets `uipath-live` only after they actually exist or run in UiPath Automation Cloud. Otherwise label them `uipath-ready`.

## Cross-Lane Contracts

- Use these folder facts everywhere: folder name `AgentFactoryDemo`, key `cba41e19-47cc-4a0a-bf73-de88b60a61be`, id `7986306`.
- Preserve platform mode labels: `local-simulated`, `uipath-ready`, `uipath-live`.
- Keep generated files, `.uipath/.skills`, `.agents/skills`, credentials, `.env`, and build output out of git.
- Do not invent Integration Service connection IDs. If no pinged connection exists, document setup or ask for approval before using a placeholder.
- Keep Test Cloud optional but honest. Do not block Maestro, Data Service, Action Center, or API Workflow integration on Test Cloud access.
- Factory Console should remain the polished demo surface; UiPath Apps is the official UiPath companion surface, not a replacement for the console.

## Verification

Run after all lanes merge:

```bash
uip --version
uip login status --output json
uip tools list --output json
uip or folders get AgentFactoryDemo --output json
uip df entities list --native-only --output json
uip maestro bpmn process list --folder-key cba41e19-47cc-4a0a-bf73-de88b60a61be --output json
uip agent list --output json
uip tasks list --folder-id 7986306 --limit 5 --output json
uip tm project list --limit 5 --output json
npm run smoke
git diff --check
```

Run artifact-specific checks added by lanes, such as `uip api-workflow validate <file> --output json`, BPMN/XML validation, JSON schema checks, and targeted package/workspace builds.

`npm audit --audit-level=moderate` is intentionally not part of the automatic suite unless the user approves sending dependency metadata to the npm registry.

## Manual Smoke

- Show Data Service entities/records or explain the approved schema proposal waiting for creation.
- Show a Maestro process definition or process instance, or the import-ready BPMN package if publish is pending.
- Show one Action Center approval contract or task and how it maps to scope/release approval.
- Show an API Workflow or no-auth/local workflow call path that triggers or polls the Build Worker.
- Show Test Manager/Test Cloud project/test set/test case evidence, or the exact `Test Cloud-ready` fallback.
- Show Factory Console status reflecting platform mode and UiPath lifecycle state.

## Non-Goals

- Slack or Teams integration.
- Multiple template families beyond Customer360.
- Production deployment to a customer environment.
- Real customer data.
- Destructive cleanup of live UiPath assets.
