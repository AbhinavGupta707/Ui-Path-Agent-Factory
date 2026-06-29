# Checkpoint 7 Maestro Solution Activation Evidence - 2026-06-29

Status: partial live Maestro activation. The direct Maestro publish path still
fails with UiPath `Invalid argument 'Period'`, but the supported UiPath
Solutions lifecycle successfully published and deployed the Agent Factory
ProcessOrchestration package into isolated folders. The current patched
candidate is `AgentFactoryMaestroSolutionBridgeSpine` version `1.0.1` in
`AgentFactoryDemoLiveSpine 1`. A runtime process run has not yet produced a
Maestro instance, Orchestrator job, or Action Center task.

## Isolation

- Organization: `galacticus`
- Tenant: `DefaultTenant`
- Original Agent Factory folder: `AgentFactoryDemo`
- Original folder id/key: `7986306` / `cba41e19-47cc-4a0a-bf73-de88b60a61be`
- Historical isolated solution folder: `AgentFactoryDemoLiveSpine`
- Historical folder id/key: `7989131` / `86717885-17bf-4d28-8253-0172c91540ec`
- Current isolated solution folder: `AgentFactoryDemoLiveSpine 1`
- Current folder id/key: `7989142` / `d991e64c-d0ad-4ec6-9798-8783b166a073`

The solution deployments were intentionally created in Agent Factory solution
folders so they do not touch the separate `TreatmentAccessHackathon` project
visible in the same tenant.

## Direct Publish Failure

The checked-in BPMN validates, including the explicit timeout durations added to
the build and deployment boundary timers:

```bash
uip maestro bpmn validate uipath/maestro/customer360-build/agent-factory-customer360-build.bpmn --output json
```

Direct publish still fails:

```bash
uip maestro bpmn process publish uipath/maestro/customer360-build /private/tmp/agent-factory-maestro-package --folder-key cba41e19-47cc-4a0a-bf73-de88b60a61be --name AgentFactoryCustomer360Build --process-name "Governed Agentic Automation Factory - Customer360 Build" --version 1.0.4 --wait --output json
```

Result:

```text
MaestroProcessPublishFailed
HTTP 400: Invalid argument 'Period'
```

CLI source inspection and the successful solution deployment indicate this is
not a BPMN timer-duration problem. The direct publish helper creates a
ProcessOrchestration release without the retention fields that the solution
deployment route supplies, while the solution-created release includes retention
period values.

## Solution Lifecycle Success

Commands used, all scoped to the Agent Factory source and isolated folder:

```bash
uip solution init /private/tmp/AgentFactoryMaestroSolutionBridgeSpine101 --output json
uip solution project import --source uipath/maestro/customer360-build --solutionFile /private/tmp/AgentFactoryMaestroSolutionBridgeSpine101/AgentFactoryMaestroSolutionBridgeSpine101.uipx --output json
uip solution pack /private/tmp/AgentFactoryMaestroSolutionBridgeSpine101 /private/tmp/agent-factory-solution-packages-101 --name AgentFactoryMaestroSolutionBridgeSpine --version 1.0.1 --output json
uip solution publish /private/tmp/agent-factory-solution-packages-101/AgentFactoryMaestroSolutionBridgeSpine_1.0.1.zip --wait --output json
uip solution deploy run --name AgentFactoryMaestroSolutionBridgeSpineDeployment101 --package-name AgentFactoryMaestroSolutionBridgeSpine --package-version 1.0.1 --folder-name "AgentFactoryDemoLiveSpine 1" --output json
```

Live deployment evidence:

| Field | Value |
|---|---|
| Solution package | `AgentFactoryMaestroSolutionBridgeSpine` |
| Version | `1.0.1` |
| Package version key | `53399a60-1edb-4d51-a054-29b17533932c` |
| Deployment key | `427de334-ba5e-4e95-bba1-d053abdad2f4` |
| Pipeline deployment id | `0558837f-54a8-4526-10b1-08ded6011ef2` |
| Activation status | `SuccessfulActivate` / active |
| Process name | `agent-factory-customer360-build` |
| Process key | `AgentFactoryMaestroSolutionBridgeSpine.Agentic.customer360-build` |
| Package process key | `AgentFactoryMaestroSolutionBridgeSpine.Agentic.customer360-build:1.0.1` |
| Release key | `70d07489-d32a-4f56-9f5e-5fadaf8b14e6` |
| Feed id | `e4c3d330-c071-4dc1-9bb9-9a18c65dfd83` |

The deployed process is visible through:

```bash
uip maestro bpmn process list --folder-key d991e64c-d0ad-4ec6-9798-8783b166a073 --output json
uip or processes list --folder-key d991e64c-d0ad-4ec6-9798-8783b166a073 --output json
```

## Runtime Run Attempt

The first run attempt without `--feed-id` failed because the CLI could not find
entry points for the solution feed. With the feed id supplied, entry point lookup
worked, but runtime start still failed:

```bash
uip maestro bpmn process run AgentFactoryMaestroSolutionBridgeSpine.Agentic.customer360-build:1.0.1 d991e64c-d0ad-4ec6-9798-8783b166a073 --release-key 70d07489-d32a-4f56-9f5e-5fadaf8b14e6 --feed-id e4c3d330-c071-4dc1-9bb9-9a18c65dfd83 --inputs '{"requestId":"REQ-2026-LIVE-101","platformMode":"uipath-live","factoryApiBaseUrl":"https://example.invalid/factory-api","buildWorkerBaseUrl":"https://example.invalid/build-worker","deploymentServiceBaseUrl":"https://example.invalid/factory-api","deploymentUrl":"https://example.invalid/customer360","bridgeToken":"<redacted>","folderKey":"d991e64c-d0ad-4ec6-9798-8783b166a073","folderId":7989142}' --output json
```

Result:

```text
MaestroProcessRunFailed
Response returned an error code
```

Scoped post-run checks:

| Check | Result |
|---|---|
| `uip maestro bpmn instance list --folder-key d991e64c-d0ad-4ec6-9798-8783b166a073 ...` | `Data: []` |
| `uip or jobs list --folder-key d991e64c-d0ad-4ec6-9798-8783b166a073 --limit 20` | `Returned: 0` |
| `uip tasks list --folder-id 7989142 --limit 20` | `Data: []` |

## Trusted Bridge Status

The repository now has a code-level trusted callback bridge contract:

- Factory API `uipath-live` callback mutations require
  `x-agent-factory-bridge-token` when `AGENT_FACTORY_BRIDGE_TOKEN` is set.
- Build Worker `/build` and `/build/{id}` require the same header when
  `AGENT_FACTORY_BRIDGE_TOKEN` is set.
- All six API Workflow JSON assets accept `bridgeToken` and send the header.
- `scripts/uipath-live-spine.mjs` passes `bridgeToken` in Maestro/API Workflow
  inputs and refuses `--execute-run` with the placeholder token.

No bridge token value is committed. No public payload bridge was run after this
hardening pass.

## Remaining Runtime Gap

The current live end state is a solution-deployed Maestro process and release,
not a completed live Maestro run. The checked-in BPMN has the correct lifecycle
model and entry point, but `bindings_v2.json` intentionally has no discovered
resources yet. UiPath registry inspection shows:

- API Workflow execution uses `Orchestrator.ExecuteApiWorkflowAsync` and
  requires process discovery/binding.
- Action Center/HITL uses `Actions.HITL` and requires supported human task/app
  discovery.
- Raw HTTP tasks can be modeled with `Intsvc.UnifiedHttpRequest`, but that would
  be a different implementation path from the API Workflow/HITL assets.

To claim a complete live Track 2 run, finish the live bindings in Maestro/Studio
Web or through a fully discovered solution source, redeploy, then capture a real
process instance/job/task id.
