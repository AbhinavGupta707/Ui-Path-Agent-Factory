# API Workflow Contracts

Status: `uipath-ready` validated JSON assets. These workflows are import-ready
and use UiPath HTTP connector local/no-auth calls only. No live API Workflow was
created or run.

## Workflows

| Name | File | Purpose | Validation |
|---|---|---|---|
| `AgentFactory_StartBuildWorker` | `AgentFactory_StartBuildWorker/Workflow.json` | Trigger the Build Worker from a Customer360 manifest | Valid |
| `AgentFactory_FetchBuildStatus` | `AgentFactory_FetchBuildStatus/Workflow.json` | Poll a Build Worker run | Valid |
| `AgentFactory_PostStatusUpdate` | `AgentFactory_PostStatusUpdate/Workflow.json` | Patch Factory API build status | Valid |
| `AgentFactory_RecordTestResult` | `AgentFactory_RecordTestResult/Workflow.json` | Convert test-gate decisions into Factory API build status | Valid |
| `AgentFactory_StartDeployment` | `AgentFactory_StartDeployment/Workflow.json` | Start approved sandbox deployment through Factory API `/deploy` | Valid/import-ready |

## Common Required Fields

```json
{
  "operationId": "unique-idempotency-key",
  "requestId": "req_123",
  "platformMode": "uipath-ready",
  "folderKey": "cba41e19-47cc-4a0a-bf73-de88b60a61be",
  "folderId": 7986306
}
```

Retries must reuse the same `operationId`. Use `uipath-live` only after a real
UiPath Automation Cloud workflow execution.

## Local Endpoint Mapping

| Workflow | Method | Target | Notes |
|---|---|---|---|
| `AgentFactory_StartBuildWorker` | `POST` | `{buildWorkerBaseUrl}/build` | Defaults to `http://localhost:8790` |
| `AgentFactory_FetchBuildStatus` | `GET` | `{buildWorkerBaseUrl}/build/{buildRunId}` | Defaults to `http://localhost:8790` |
| `AgentFactory_PostStatusUpdate` | `PATCH` | `{factoryApiBaseUrl}/api/builds/{buildRunId}/status` | Defaults to `http://localhost:8787` |
| `AgentFactory_RecordTestResult` | `PATCH` | `{factoryApiBaseUrl}/api/builds/{buildRunId}/status` | Maps test decisions to build statuses |
| `AgentFactory_StartDeployment` | `POST` | `{deploymentServiceBaseUrl}/deploy` | Defaults to `http://localhost:8787`; Factory API records sandbox deployment evidence |

## Run Mode

- Validation is autonomous and was completed with `uip api-workflow validate`.
- Runtime execution was not performed because `uip api-workflow run` can make
  HTTP calls with side effects.
- The checked-in workflows are designed for `--no-auth` local HTTP once the
  target local service is running.
- With-auth runs require explicit approval.
- No Integration Service connection IDs are present or required for these HTTP
  workflows.

## Deployment Evidence

`AgentFactory_StartDeployment` calls `POST /deploy` after release approval. The
Factory API endpoint requires `operationId` or `x-agent-factory-operation-id`,
rejects `environment: "production"`, and returns deployment evidence:

```json
{
  "requestId": "REQ-2026-001",
  "buildRunId": "BUILD-REQ-2026-001-001",
  "environment": "sandbox",
  "deploymentStatus": "deployed",
  "deploymentUrl": "http://localhost:5174",
  "rollbackNotes": "Sandbox-only deployment; rollback by stopping the local app or redeploying the previous preview. Production is disabled.",
  "platformMode": "uipath-ready"
}
```

Retries with the same idempotency key return the same evidence with
`idempotentReplay: true`. Use `uipath-ready` until the workflow is actually run
in UiPath Automation Cloud.

## Validation Commands

```bash
uip api-workflow validate uipath/api-workflows/AgentFactory_StartBuildWorker/Workflow.json --output json
uip api-workflow validate uipath/api-workflows/AgentFactory_FetchBuildStatus/Workflow.json --output json
uip api-workflow validate uipath/api-workflows/AgentFactory_PostStatusUpdate/Workflow.json --output json
uip api-workflow validate uipath/api-workflows/AgentFactory_RecordTestResult/Workflow.json --output json
uip api-workflow validate uipath/api-workflows/AgentFactory_StartDeployment/Workflow.json --output json
```

Each command returned:

```json
{
  "Result": "Success",
  "Code": "ApiwfValidate",
  "Data": {
    "Status": "Valid"
  }
}
```

## Setup Needed Before Live Use

- Publish/import the workflow files into a UiPath API Workflow project or
  solution through the official UiPath flow.
- Configure target service base URLs as environment-specific values, preferably
  Orchestrator assets.
- Start the local Build Worker for build trigger/polling flows.
- Start the local Factory API for status/test-result/deployment flows.
- Start the local Customer360 dashboard or record a Vercel preview URL before
  running `AgentFactory_StartDeployment`.
