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
| `AgentFactory_StartDeployment` | `AgentFactory_StartDeployment/Workflow.json` | Start approved sandbox deployment when a deploy endpoint exists | Valid/import-ready |

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
| `AgentFactory_StartDeployment` | `POST` | `{deploymentServiceBaseUrl}/deploy` | Defaults to `http://localhost:8791`; endpoint pending |

## Run Mode

- Validation is autonomous and was completed with `uip api-workflow validate`.
- Runtime execution was not performed because `uip api-workflow run` can make
  HTTP calls with side effects.
- The checked-in workflows are designed for `--no-auth` local HTTP once the
  target local service is running.
- With-auth runs require explicit approval.
- No Integration Service connection IDs are present or required for these HTTP
  workflows.

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
- Start the local Factory API for status/test-result flows.
- Implement or provide a deployment service before running
  `AgentFactory_StartDeployment`.
