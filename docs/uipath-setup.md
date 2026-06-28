# UiPath Setup And Platform Mapping

This document records the UiPath setup facts and the Checkpoint 1 mapping from
the local Factory lifecycle to planned Automation Cloud assets.

## Verified Context

Use these values exactly until a future checkpoint verifies a replacement:

| Fact | Value |
|---|---|
| Organization | `galacticus` |
| Tenant | `DefaultTenant` |
| Orchestrator folder | `AgentFactoryDemo` |
| Folder key | `cba41e19-47cc-4a0a-bf73-de88b60a61be` |
| Folder id | `7986306` |

## Current Asset State

| Capability | Verification status | Live asset state |
|---|---|---|
| Orchestrator folder | `uip or folders get AgentFactoryDemo --output json` succeeded | Folder exists |
| Maestro / Process Orchestration | CLI list commands succeeded | No process created yet |
| Agents / Agent Builder | `uip agent list --output json` succeeded | No agent solutions created yet |
| Integration Service | Tool installed and connector probes succeeded | GitHub connector discovered, no connection configured yet |
| Data Service / Data Fabric | `uip df entities list --native-only --output json` succeeded | No entities created yet |
| Action Center | `uip tasks list --folder-id 7986306 --limit 1 --output json` succeeded | No tasks created yet |
| Test Manager / Test Cloud | Tool installed and project list succeeded | No project created yet |
| Apps | Portal search found Apps | No app created yet, no Apps CLI coverage confirmed |

Do not describe the planned Checkpoint 1 artifacts as deployed, published, or
live-created until Checkpoint 4 creates them in Automation Cloud.

## Platform Mode Labels

Use these labels consistently across API payloads, Data Service records, audit
events, and demo copy:

| Label | Meaning |
|---|---|
| `local-simulated` | The local Factory API and Console are exercising the lifecycle without live UiPath execution. |
| `uipath-ready` | The record has enough contract data for Maestro/API Workflows/Data Service to take over, but the live platform object is not yet executing it. |
| `uipath-live` | Maestro, Data Service, Action Center, API Workflows, or Test Manager are actively executing or storing the lifecycle in Automation Cloud. |

Checkpoint 1 remains `local-simulated` except for verified readiness probes.

## Discovery-First Activation Flow

Diagnose in layer order:

1. Confirm login and tenant context.
2. Confirm the folder exists.
3. Confirm each UiPath capability is discoverable or enabled.
4. Confirm official activation or creation flows.
5. Only then debug runtime permissions, API calls, or worker behavior.

Recommended commands:

```bash
uip login status --output json
uip or folders get AgentFactoryDemo --output json
uip maestro bpmn processes list --output json
uip maestro bpmn process list --folder-key cba41e19-47cc-4a0a-bf73-de88b60a61be --output json
uip agent list --output json
uip df entities list --native-only --output json
uip tasks list --folder-id 7986306 --limit 1 --output json
uip tools list --output json
uip is connectors list --filter github --output json
uip tm project list --limit 1 --output json
```

Use the Automation Cloud portal for Apps and any OAuth activation flow that is
not exposed through the CLI.

## Checkpoint 1 Local Lifecycle

The current local product exposes:

| Surface | Implemented behavior |
|---|---|
| Factory API | `GET /health`, `GET /api/requests`, `POST /api/intake` |
| Shared contracts | Request, spec, governance, manifest, build run, audit, UiPath context schemas |
| Factory Console | Polished status surface showing intake, governance, build, review, deploy stages |
| Build Worker | Scaffold server plus Codex build-plan helpers |

`POST /api/intake` creates an `AutomationRequest` with status
`needs_clarification` and an `intake_created` audit event. Later lifecycle states
are defined in shared contracts and mapped in the docs, but not yet fully
executed by local API handlers in this lane.

## Planned UiPath Asset Names

| Area | Planned asset name |
|---|---|
| Maestro process | `Governed Agentic Automation Factory - Customer360 Build` |
| Data Service application namespace | `AgentFactory` |
| Scope approval task | `Agent Factory Scope Approval` |
| Release approval task | `Agent Factory Release Approval` |
| API Workflow: build trigger | `AgentFactory_StartBuildWorker` |
| API Workflow: status callback | `AgentFactory_PostStatusUpdate` |
| API Workflow: deploy trigger | `AgentFactory_StartDeployment` |
| Test Manager project | `Agent Factory Quality Gates` |
| UiPath Apps app | `Agent Factory Intake Companion` |

## Checkpoint 4 Creation Order

1. Re-run readiness commands and confirm the folder facts still match.
2. Create the Data Service entities from `uipath/data-service/schema.json`.
3. Create Agent Builder solutions from `uipath/agents/agent-contracts.md`.
4. Create Action Center forms/tasks from `uipath/action-center/approval-contracts.md`.
5. Create API Workflows from `uipath/api-workflows/contracts.md`.
6. Create the Maestro BPMN process from `uipath/maestro/process-contract.json`.
7. Create the Test Manager/Test Cloud project and test set from `uipath/test-cloud/test-plan.md`.
8. Create the UiPath Apps companion surface from `uipath/apps/companion-app.md`.
9. Execute one end-to-end request and update records from `uipath-ready` to `uipath-live` only for assets that actually run.
