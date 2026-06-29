# UiPath Live Spine Activation

Status: live-ready, approval-gated. This runbook exists to turn the current validated/import-ready state into a serious Track 2 live Automation Cloud run. Do not execute publish/run/task/data/write commands until the exact command and target are approved.

## What This Adds

Checkpoint 7 now has a product-level live evidence receiver:

- `GET /api/uipath/readiness` reports Track 2 readiness and approval-gated gaps.
- `POST /api/requests/:id/uipath-event` records live Maestro/API Workflow/Action Center/Data Service/Test Manager identifiers.
- `AgentFactory_RecordUiPathEvent` calls that endpoint from a UiPath API Workflow.
- The Factory Console evidence drawer shows `uipath-live` only when real live ids are present.

## Minimum Serious Track 2 Run

The minimum credible live spine is:

1. Start the local product stack with `npm run dev:live`.
2. Expose Factory API and Build Worker through an approved HTTPS bridge.
3. Publish the Maestro BPMN into folder `AgentFactoryDemo`.
4. Run one Maestro process instance with `requestId` and endpoint inputs.
5. Record the returned Maestro job/trace id through `AgentFactory_RecordUiPathEvent`.
6. Let the run reach a live human gate; capture the Action Center/Maestro task id.
7. Record at least one API Workflow execution id or handoff id in the Factory API timeline.
8. Show the Factory Console evidence drawer with `uipath-live` rows for the live ids.

Data Service writes, live Test Cloud execution, and live Codex execution strengthen the entry, but they are not the first blocker once Maestro + human gate + API handoff are live.

## Safe Commands

These commands do not mutate UiPath resources:

```bash
npm run uipath:live-plan
npm run uipath:readiness
```

`uipath:readiness` checks login, folder, Test Manager catalog, BPMN validation, and all six API Workflow validations.

## Approval-Gated Commands

`npm run uipath:live-plan` prints the exact current command shapes for:

- `uip maestro bpmn process publish ...`
- `uip maestro bpmn process list ...`
- `uip maestro bpmn process run ...`
- `uip api-workflow run uipath/api-workflows/AgentFactory_RecordUiPathEvent/Workflow.json ...`
- `uip tasks list ...`

The helper refuses mutation unless `AGENT_FACTORY_APPROVE_UIPATH_LIVE=true` and an explicit `--execute-*` flag are used.

## Evidence To Capture

After an approved run, record these in the Factory Console and final submission evidence:

| Evidence | Required for serious Track 2 claim |
|---|---|
| Maestro process key/release key | Yes |
| Maestro job key or process instance id | Yes |
| API Workflow execution id or live handoff id | Yes |
| Action Center/Maestro human task id | Yes |
| Data Service record id | Nice-to-have |
| Test Manager/Test Cloud execution id | Nice-to-have |
| Live Codex session/diff/test evidence | Nice-to-have bonus |

Do not claim live execution for any row that does not have a real id.
