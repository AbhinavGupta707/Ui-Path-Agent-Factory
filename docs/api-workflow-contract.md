# API Workflow Contract

This document defines the Checkpoint 4 UiPath API Workflow lane. The JSON
assets are `uipath-ready`, validated locally with `uip api-workflow validate`,
and intentionally use no-auth/local HTTP through the UiPath HTTP connector
(`uipath-uipath-http`, `connectionId: "ImplicitConnection"`). No workflow was
run with auth and no live Automation Cloud API Workflow asset was created.

## Verified Context

| Field | Value |
|---|---|
| Organization | `galacticus` |
| Tenant | `DefaultTenant` |
| Folder | `AgentFactoryDemo` |
| Folder key | `cba41e19-47cc-4a0a-bf73-de88b60a61be` |
| Folder id | `7986306` |

## Validated Workflows

| Workflow | Purpose | Local file | Runtime status |
|---|---|---|---|
| `AgentFactory_StartBuildWorker` | Queue the Build Worker from a Customer360 manifest | `uipath/api-workflows/AgentFactory_StartBuildWorker/Workflow.json` | No-auth/local when worker runs on `http://localhost:8790` |
| `AgentFactory_FetchBuildStatus` | Poll Build Worker status by build run id | `uipath/api-workflows/AgentFactory_FetchBuildStatus/Workflow.json` | No-auth/local when worker runs on `http://localhost:8790` |
| `AgentFactory_PostStatusUpdate` | Mirror build/deploy status into Factory API | `uipath/api-workflows/AgentFactory_PostStatusUpdate/Workflow.json` | No-auth/local when Factory API runs on `http://localhost:8787` |
| `AgentFactory_RecordTestResult` | Map test-gate decisions to Factory API build status | `uipath/api-workflows/AgentFactory_RecordTestResult/Workflow.json` | No-auth/local when Factory API runs on `http://localhost:8787` |
| `AgentFactory_StartDeployment` | Start approved sandbox deployment | `uipath/api-workflows/AgentFactory_StartDeployment/Workflow.json` | Import-ready; local `/deploy` endpoint is not implemented yet |

`AgentFactory_SyncDataServiceRecord` remains a future Data Service mirror
workflow. This lane did not create it because Data Service schema and live entity
creation are owned by the Maestro/Data Service lane.

## Common Fields

Every workflow input includes:

| Field | Purpose |
|---|---|
| `requestId` | Primary correlation key, same as `AutomationRequest.request_id` |
| `operationId` | Unique idempotency key; retries must reuse the same value |
| `platformMode` | `local-simulated`, `uipath-ready`, or `uipath-live` |
| `folderKey` | `cba41e19-47cc-4a0a-bf73-de88b60a61be` |
| `folderId` | `7986306` |

Use `uipath-live` only after a workflow actually executes in UiPath Automation
Cloud. The checked-in assets default to `uipath-ready`.

## AgentFactory_StartBuildWorker

Trigger point: Maestro after scope approval and build planning.

Validated no-auth/local HTTP call:

```http
POST /build
content-type: application/json
x-agent-factory-operation-id: build_req_123_001
```

Inputs include `buildWorkerBaseUrl` and `manifest`. The workflow builds this
body for the local worker:

```json
{
  "operationId": "build_req_123_001",
  "requestId": "req_123",
  "platformMode": "uipath-ready",
  "folderKey": "cba41e19-47cc-4a0a-bf73-de88b60a61be",
  "folderId": 7986306,
  "manifest": {
    "requestId": "req_123",
    "template": "customer360-dashboard",
    "branchName": "factory/req-123",
    "outputApp": "apps/customer360-template",
    "acceptanceCriteria": ["Dashboard builds", "Risk accounts are visible"],
    "permissions": ["read:crm_accounts", "read:product_usage"],
    "codexModel": "gpt-5.5"
  },
  "callbacks": {}
}
```

Expected worker response:

```json
{
  "buildRunId": "BUILD-req_123-001",
  "requestId": "req_123",
  "status": "build_queued",
  "platformMode": "uipath-ready"
}
```

## AgentFactory_FetchBuildStatus

Trigger point: Maestro polling, API Workflow polling, or demo status refresh.

Validated no-auth/local HTTP call:

```http
GET /build/{buildRunId}
content-type: application/json
x-agent-factory-operation-id: fetch_req_123_001
```

Required inputs:

```json
{
  "operationId": "fetch_req_123_001",
  "requestId": "req_123",
  "buildRunId": "BUILD-req_123-001",
  "buildWorkerBaseUrl": "http://localhost:8790"
}
```

## AgentFactory_PostStatusUpdate

Trigger point: build worker callbacks, API Workflow callbacks, Maestro service
tasks, or deployment status updates.

Validated no-auth/local HTTP call:

```http
PATCH /api/builds/{buildRunId}/status
content-type: application/json
x-agent-factory-operation-id: status_req_123_001
```

Request body built from workflow inputs:

```json
{
  "status": "building",
  "worker_id": "build-worker-core",
  "logs_uri": "https://example.invalid/build-log"
}
```

Allowed `status` values follow `BuildStatusUpdateSchema`: `build_queued`,
`building`, `build_failed`, `tests_running`, `tests_failed`,
`awaiting_release_approval`, `deploying`, `deployed`, `blocked`, or
`cancelled`.

Local effects:

- Factory API updates the matching `BuildRun`.
- Factory API mirrors `AutomationRequest.status`.
- Factory API appends `AuditEvent.action = "build_status_updated"`.

## AgentFactory_RecordTestResult

Trigger point: local worker quality gates, Test Manager/Test Cloud callback, or
Maestro service task after tests complete.

Validated no-auth/local HTTP call:

```http
PATCH /api/builds/{buildRunId}/status
content-type: application/json
x-agent-factory-operation-id: test_req_123_001
```

Decision mapping:

| `qualityGateDecision` | Factory API status |
|---|---|
| `passed` | `awaiting_release_approval` |
| `failed` | `tests_failed` |
| `blocked` or `waiver_requested` | `blocked` |

The `testResult` input may include `worker_id`, `generated_files_json`, and
`logs_uri`. Raw test logs, secrets, and PII must not be sent.

## AgentFactory_StartDeployment

Trigger point: release approval outcome is `approved`.

Import-ready no-auth/local HTTP call:

```http
POST /deploy
content-type: application/json
x-agent-factory-operation-id: deploy_req_123_001
```

Request body built from workflow inputs:

```json
{
  "operationId": "deploy_req_123_001",
  "requestId": "req_123",
  "platformMode": "uipath-ready",
  "folderKey": "cba41e19-47cc-4a0a-bf73-de88b60a61be",
  "folderId": 7986306,
  "buildRunId": "BUILD-req_123-001",
  "environment": "sandbox",
  "pullRequestUrl": "https://example.invalid/pr/123",
  "releaseApproval": {
    "approvalId": "appr_req_123_release_001",
    "decidedBy": "release-approver"
  }
}
```

Current runtime status:

- The workflow validates structurally and is ready for import.
- The local repo does not currently expose `POST /deploy`.
- After a real deployment service exists, `AgentFactory_PostStatusUpdate` should
  mirror `deploying`, `deployed`, or `blocked` into Factory API/Data Service.

## Validation

Each workflow returned `Result: "Success"`, `Code: "ApiwfValidate"`, and
`Data.Status: "Valid"`:

```bash
uip api-workflow validate uipath/api-workflows/AgentFactory_StartBuildWorker/Workflow.json --output json
uip api-workflow validate uipath/api-workflows/AgentFactory_FetchBuildStatus/Workflow.json --output json
uip api-workflow validate uipath/api-workflows/AgentFactory_PostStatusUpdate/Workflow.json --output json
uip api-workflow validate uipath/api-workflows/AgentFactory_RecordTestResult/Workflow.json --output json
uip api-workflow validate uipath/api-workflows/AgentFactory_StartDeployment/Workflow.json --output json
```

No `uip api-workflow run` command was executed. Runtime execution, especially
with auth, requires explicit approval because workflow calls can have side
effects.

## Security And Secrets

- Store service endpoints and credentials as Orchestrator assets or Integration
  Service connections before live deployment.
- Do not include bearer tokens, API keys, `.env` values, raw PII, or local auth
  files in workflow payloads.
- Do not invent Integration Service connection IDs. Current discovery returned
  no configured connections.
- Use HTTPS endpoints for any live worker, Factory API, or deployment service
  calls.
