# UiPath Live Spine Activation

Status: partial activation completed, Maestro solution deployment live, Maestro runtime run still blocked. The 2026-06-29 activation proved the API Workflow local-runner -> Build Worker -> live Codex -> sandbox deployment path. Later approved passes deployed the Maestro ProcessOrchestration package through UiPath Solutions into isolated Agent Factory folders; the current patched candidate is `1.0.1` in `AgentFactoryDemoLiveSpine 1`. `uip maestro bpmn process run` still did not create a cloud process instance/job/task. Do not execute future run/task/data/write commands until the exact command and target are reviewed against the shared-tenant isolation plan.

## What This Adds

Checkpoint 7 now has a product-level live evidence receiver:

- `GET /api/uipath/readiness` reports Track 2 readiness and approval-gated gaps.
- `POST /api/requests/:id/uipath-event` records live Maestro/API Workflow/Action Center/Data Service/Test Manager identifiers.
- `AgentFactory_RecordUiPathEvent` calls that endpoint from a UiPath API Workflow.
- The Factory Console evidence drawer shows `uipath-live` only when real live ids are present.
- Factory API and Build Worker support a trusted callback bridge through `AGENT_FACTORY_BRIDGE_TOKEN` and `x-agent-factory-bridge-token`; all six API Workflow assets pass optional `bridgeToken`.

## Current Activation Evidence

- `AgentFactory_StartBuildWorker` ran through the local UiPath API Workflow runner against `127.0.0.1`.
- Build run `BUILD-REQ-2026-001-001` passed live Codex readiness/build in an isolated workspace.
- Codex readiness session id: `019f14f9-8e3b-7232-9d59-6ee2c428279f`.
- The worker generated 14 files and passed `codex-readiness`, `codex-build`, `workspace-inputs`, `forbidden-actions`, and `manifest-allowlist`.
- Factory API recorded sandbox deployment `DEP-REQ-2026-001-001`.
- Live Maestro process/release exists in isolated folder `AgentFactoryDemoLiveSpine 1`; no live Maestro process instance, Action Center task, Data Service record, or Test Cloud execution id exists yet.

## Minimum Serious Track 2 Run

The minimum credible live spine is:

1. Start the local product stack with `npm run dev:live`.
2. Expose Factory API and Build Worker through an approved HTTPS bridge with `AGENT_FACTORY_BRIDGE_TOKEN` set server-side.
3. Deploy or update the Maestro BPMN through UiPath Solutions into an isolated Agent Factory folder such as `AgentFactoryDemoLiveSpine 1`.
4. Bind Maestro service/user tasks to live API Workflow, Agent, and Action Center resources, then run one Maestro process instance with `requestId`, endpoint inputs, and `bridgeToken`.
5. Record the returned Maestro job/trace id through `AgentFactory_RecordUiPathEvent`.
6. Let the run reach a live human gate; capture the Action Center/Maestro task id.
7. Record at least one API Workflow execution id or handoff id in the Factory API timeline.
8. Show the Factory Console evidence drawer with `uipath-live` rows for the live ids.

Data Service writes and live Test Cloud execution would strengthen the entry. Bounded live Codex evidence and a live Maestro process/release now exist, but the first blocker for a full Track 2 cloud-run claim remains executable Maestro runtime bindings plus a real human gate.

## Safe Commands

These commands do not mutate UiPath resources:

```bash
npm run uipath:live-plan
npm run uipath:readiness
```

`uipath:readiness` checks login, folder, Test Manager catalog, BPMN validation, and all six API Workflow validations.

## Approval-Gated Commands

`npm run uipath:live-plan` prints the exact current command shapes for:

- the UiPath Solutions lifecycle used for the live process deployment,
- the legacy direct `uip maestro bpmn process publish ...` command shape and its known `Invalid argument 'Period'` failure,
- `uip maestro bpmn process list ...`
- `uip maestro bpmn process run ...`
- `uip api-workflow run uipath/api-workflows/AgentFactory_RecordUiPathEvent/Workflow.json ...`
- `uip tasks list ...`

The helper refuses mutation unless `AGENT_FACTORY_APPROVE_UIPATH_LIVE=true` and an explicit `--execute-*` flag are used.

## Evidence Still To Capture

After an approved run, record these in the Factory Console and final submission evidence:

| Evidence | Required for serious Track 2 claim |
|---|---|
| Maestro process key/release key | Captured: `AgentFactoryMaestroSolutionBridgeSpine.Agentic.customer360-build:1.0.1` / `70d07489-d32a-4f56-9f5e-5fadaf8b14e6` |
| Maestro job key or process instance id | Yes |
| API Workflow execution id or live handoff id | Yes |
| Action Center/Maestro human task id | Yes |
| Data Service record id | Nice-to-have |
| Test Manager/Test Cloud execution id | Nice-to-have |
| Additional live Codex session/diff/test evidence | Nice-to-have bonus; one bounded activation already exists |

Do not claim live execution for any row that does not have a real id.
