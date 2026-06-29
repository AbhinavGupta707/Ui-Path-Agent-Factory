# UiPath Setup And Platform Mapping

This document records the current UiPath facts for `galacticus / DefaultTenant / AgentFactoryDemo`. It should be read together with [component-map.md](component-map.md) and the source files under `uipath/`.

## Verified Context

| Fact | Value |
|---|---|
| Organization | `galacticus` |
| Tenant | `DefaultTenant` |
| Orchestrator folder | `AgentFactoryDemo` |
| Folder key | `cba41e19-47cc-4a0a-bf73-de88b60a61be` |
| Folder id | `7986306` |
| UiPath CLI used in orchestration | `1.195.1` |

## Current Asset State

| Capability | Current state | Live boundary |
|---|---|---|
| Orchestrator folder | Live folder exists and read-only discovery passed. | Folder reads are safe; job/process mutations still require approval. |
| Test Manager/Test Cloud | Live project `Agent Factory Quality Gates` (`AFQG`), test set `Customer360 Release Gate` (`AFQG:1`), and seven test cases exist. | No live Test Cloud execution has been approved or run. |
| Data Service | Proposal-only schema in `uipath/data-service/schema.json`. | Choice sets, entities, fields, and seed records must not be created without approval. |
| Maestro BPMN | Validated, import-ready project in `uipath/maestro/customer360-build`. | Publish or run only after approval and after required dependencies are ready. |
| UiPath Agents | Five local low-code Agent Builder projects validate with `uip agent validate`. | Upload, publish, deploy, or run only after approval. |
| API Workflows | Five workflow JSON assets validate with `uip api-workflow validate`. | Upload or runtime execution only after approval; live use must override local base URLs with an approved HTTPS Factory API/Build Worker callback bridge. |
| Action Center | Scope and release approval contracts are proposal-only. No live tasks were created or completed. | Task creation and completion are live business decisions and need approval. |
| UiPath Apps / Coded App | Companion app contract is proposal-only. | Pack/publish/deploy only after approval. |
| Integration Service | GitHub connector is discoverable; no connection is configured. | Do not invent connection IDs or perform OAuth/connection setup without approval. |
| UiPath for Coding Agents | Local skill install path is documented with `uip skills install --agent codex --local`. | Generated `.uipath/.skills` and `.agents/skills` are ignored and must not be committed. |

## Live Test Manager Catalog

| Artifact | Live key/id | Name |
|---|---|---|
| Project | `AFQG` / `2760d770-7e82-0000-66f7-0b49d3053e3f` | `Agent Factory Quality Gates` |
| Test set | `AFQG:1` / `66cdd3ea-c873-0200-58fb-0b49d305588a` | `Customer360 Release Gate` |
| Test case | `AFQG:2` | `AF-QG-001 Workspace smoke passes` |
| Test case | `AFQG:7` | `AF-QG-002 Metric correctness checks pass` |
| Test case | `AFQG:3` | `AF-QG-003 PII masking guardrails pass` |
| Test case | `AFQG:8` | `AF-QG-004 Generated dashboard builds` |
| Test case | `AFQG:4` | `AF-QG-005 Worker manifest validation passes` |
| Test case | `AFQG:6` | `AF-QG-006 Release approval evidence complete` |
| Test case | `AFQG:5` | `AF-QG-007 Failed gate blocks deployment` |

## Platform Mode Labels

Use these labels consistently in payloads, UI copy, docs, and audit events:

| Label | Meaning |
|---|---|
| `local-simulated` | The local Factory API/Console is executing the lifecycle without live UiPath runtime mutation. |
| `uipath-ready` | The asset or record is shaped for UiPath import/execution, but the live platform object has not executed it. |
| `uipath-live` | A UiPath Automation Cloud asset actually exists, runs, stores state, or records the evidence. |

Do not mark a component `uipath-live` just because a source file exists in the repo. Use it only for verified live assets such as the Orchestrator folder and the Test Manager catalog.

## Discovery-First Activation Flow

Diagnose in layer order:

1. Confirm login and tenant context.
2. Confirm the Orchestrator folder exists.
3. Confirm the product surface is discoverable or enabled.
4. Follow official activation, import, publish, or creation flows.
5. Only then debug runtime permissions, API calls, or worker behavior.

Safe read-only checks:

```bash
uip login status --output json
uip or folders get AgentFactoryDemo --output json
uip tm project list --limit 5 --output json
uip tm testcases list --project-key AFQG --output json
uip tm testsets list --project-key AFQG --output json
uip tm testsets list-testcases --project-key AFQG --test-set-key AFQG:1 --output json
uip df entities list --native-only --output json
uip df choice-sets list --output json
uip maestro bpmn process list --folder-key cba41e19-47cc-4a0a-bf73-de88b60a61be --output json
uip agent list --output json
uip tasks list --folder-id 7986306 --limit 5 --output json
uip is connections list --output json
```

Use the Automation Cloud portal only when the CLI lacks a clear read-only command or an OAuth/activation step needs the logged-in browser.

## Checkpoint 7 Maestro Cloud Activation

Track 2 live mode is approval-gated and starts with registration/discovery, not
runtime debugging. Before any live publish, run, task, Data Service write, or
Test Cloud execution, confirm these layers in order:

1. `uip login status --output json` returns the expected `galacticus /
   DefaultTenant` context.
2. `uip or folders get AgentFactoryDemo --output json` returns folder id
   `7986306` and key `cba41e19-47cc-4a0a-bf73-de88b60a61be`.
3. Maestro, API Workflow, Action Center, Data Service, and Test Manager
   surfaces are discoverable with the safe read-only commands below.
4. A user-approved HTTPS callback bridge exists for Factory API and Build Worker
   traffic from Automation Cloud. Localhost is acceptable only for local
   validation; it is not a live Automation Cloud callback target.
5. Workflow inputs or Orchestrator assets are prepared with the approved
   endpoint values. Do not commit endpoint secrets, tunnel tokens, `.env`
   values, or generated build output.
6. Only after the operator approves the exact command, publish/run Maestro,
   execute API Workflows, complete Action Center tasks, create Data Service
   schema/records, or run Test Manager/Test Cloud.

Endpoint values to prepare for the live run:

| Runtime surface | Workflow input | Local default | Live value |
|---|---|---|---|
| Factory API status/test/deploy callbacks | `factoryApiBaseUrl`, `deploymentServiceBaseUrl` | `http://localhost:8787` | `https://<approved-factory-api-host>` |
| Build Worker build/poll handoff | `buildWorkerBaseUrl` | `http://localhost:8790` | `https://<approved-build-worker-host>` |
| Customer360 sandbox preview | `deploymentUrl` | `http://localhost:5174` | approved sandbox preview URL |

Evidence ids to copy back into the Factory API timeline when available:

- Maestro process id and run/process-instance id,
- API Workflow execution id,
- Action Center task id for scope and release gates,
- Data Service record ids for mirrored lifecycle rows,
- Test Manager project/test set/test execution ids.

## Source-Controlled UiPath Assets

| Area | Source of truth | Status |
|---|---|---|
| Maestro | `uipath/maestro/customer360-build/agent-factory-customer360-build.bpmn` | Import-ready, validated, not published |
| Data Service | `uipath/data-service/schema.json` | Proposal-only |
| Agents | `uipath/agents/AgentFactoryAgents/` | Validated local solution, not uploaded |
| API Workflows | `uipath/api-workflows/*/Workflow.json` | Validated local JSON, not run |
| Action Center | `uipath/action-center/approval-contracts.json` | Proposal-only |
| UiPath Apps | `uipath/apps/companion-app.contract.json` | Proposal-only |
| Test Manager | `uipath/test-cloud/quality-gate-assets.json` | Live catalog documented; no execution |

## Planned Asset Names

| Area | Asset name |
|---|---|
| Maestro process | `Governed Agentic Automation Factory - Customer360 Build` |
| Data Service namespace | `AgentFactory` |
| Scope approval task | `Agent Factory Scope Approval` |
| Release approval task | `Agent Factory Release Approval` |
| API Workflow: build trigger | `AgentFactory_StartBuildWorker` |
| API Workflow: status callback | `AgentFactory_PostStatusUpdate` |
| API Workflow: deploy trigger | `AgentFactory_StartDeployment` |
| Test Manager project | `Agent Factory Quality Gates` |
| UiPath Apps app | `Agent Factory Intake Companion` |

## Approval-Required Actions

Do not run these without explicit approval for the exact command and expected side effect:

```bash
uip df choice-sets create ...
uip df choice-set-values create ...
uip df entities create ...
uip maestro bpmn publish ...
uip maestro bpmn run ...
uip agent push ...
uip solution upload ...
uip agent publish ...
uip agent deploy ...
uip api-workflow run ...
uip tasks complete ...
uip codedapp publish ...
uip codedapp deploy ...
```

Live Test Manager execution also requires approval because it creates execution evidence in Automation Cloud.

## Demo Guidance

- Present Factory Console as the polished primary operator surface.
- Present UiPath as the governed orchestration/control plane.
- Show Test Manager catalog as live quality-gate evidence.
- Label Data Service, Maestro, Agents, API Workflows, Action Center, and Apps according to their current states above.
- If a deployment/runtime lane adds a working sandbox `/deploy` endpoint or hosted preview URL, update README, demo script, Devpost copy, and checklist before final submission.
