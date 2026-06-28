# API Workflow Contract

This document defines planned UiPath API Workflow calls for Checkpoint 4. The
current Checkpoint 1 build worker is a scaffold and does not yet implement all
of these endpoints.

## Verified Context

| Field | Value |
|---|---|
| Organization | `galacticus` |
| Tenant | `DefaultTenant` |
| Folder | `AgentFactoryDemo` |
| Folder key | `cba41e19-47cc-4a0a-bf73-de88b60a61be` |
| Folder id | `7986306` |

## Planned Workflows

| Workflow | Direction | Purpose | Current status |
|---|---|---|---|
| `AgentFactory_StartBuildWorker` | UiPath to Build Worker | Trigger Codex build from a `BuildManifest` | Planned |
| `AgentFactory_PostStatusUpdate` | Build Worker or UiPath to Factory API/Data Service | Persist build, test, deploy, and audit events | Planned |
| `AgentFactory_StartDeployment` | UiPath to Build Worker/deploy service | Deploy approved sandbox artifact | Planned |
| `AgentFactory_SyncDataServiceRecord` | Factory API or Maestro to Data Service | Upsert lifecycle records | Planned |

## Correlation And Idempotency

Every workflow payload must include:

| Field | Purpose |
|---|---|
| `requestId` | Primary correlation key, same as `AutomationRequest.requestId` |
| `operationId` | Unique idempotency key for this workflow invocation |
| `platformMode` | `local-simulated`, `uipath-ready`, or `uipath-live` |
| `folderKey` | `cba41e19-47cc-4a0a-bf73-de88b60a61be` |
| `folderId` | `7986306` |

Retries must use the same `operationId`. A repeated payload with the same
`operationId` should not create duplicate build runs, approval records, or
deployments.

## AgentFactory_StartBuildWorker

Trigger point: Maestro after scope approval and build planning.

Planned HTTP call:

```http
POST /build
content-type: application/json
x-agent-factory-operation-id: build_req_123_001
```

Request body:

```json
{
  "operationId": "build_req_123_001",
  "requestId": "req_123",
  "platformMode": "uipath-live",
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
  "callbacks": {
    "statusWorkflow": "AgentFactory_PostStatusUpdate",
    "statusEndpoint": "planned-factory-api-callback",
    "auditEndpoint": "planned-factory-api-audit-callback"
  }
}
```

Success response:

```json
{
  "buildRunId": "build_req_123_001",
  "requestId": "req_123",
  "status": "queued",
  "acceptedAt": "2026-06-28T12:00:00.000Z"
}
```

Failure response:

```json
{
  "error": "build_rejected",
  "message": "Build manifest failed validation.",
  "requestId": "req_123",
  "operationId": "build_req_123_001"
}
```

Data Service writes:

- Create `BuildRun.status = "queued"`.
- Set `AutomationRequest.status = "building"`.
- Write `AuditEvent.action = "build_started"`.

## AgentFactory_PostStatusUpdate

Trigger point: build worker callbacks, API Workflow callbacks, Maestro service
tasks, or CI/Test Cloud status updates.

Planned HTTP call to Factory API:

```http
POST /api/uipath/status
content-type: application/json
x-agent-factory-operation-id: status_req_123_001
```

Request body:

```json
{
  "operationId": "status_req_123_001",
  "requestId": "req_123",
  "platformMode": "uipath-live",
  "eventType": "build_status_updated",
  "status": "building",
  "buildRun": {
    "buildRunId": "build_req_123_001",
    "status": "running",
    "startedAt": "2026-06-28T12:01:00.000Z",
    "logsUrl": "https://example.invalid/build-log"
  },
  "audit": {
    "actor": "build-worker",
    "summary": "Codex build started for req_123."
  }
}
```

Allowed `eventType` values:

- `build_status_updated`
- `quality_gate_started`
- `quality_gate_completed`
- `deployment_started`
- `deployment_completed`
- `request_failed`

Success response:

```json
{
  "requestId": "req_123",
  "accepted": true,
  "updatedStatus": "building"
}
```

Data Service writes:

- Update the matching child entity for the event.
- Update `AutomationRequest.status` if the status changes.
- Append an `AuditEvent`.

## AgentFactory_StartDeployment

Trigger point: release approval outcome is `approved`.

Planned HTTP call:

```http
POST /deploy
content-type: application/json
x-agent-factory-operation-id: deploy_req_123_001
```

Request body:

```json
{
  "operationId": "deploy_req_123_001",
  "requestId": "req_123",
  "platformMode": "uipath-live",
  "folderKey": "cba41e19-47cc-4a0a-bf73-de88b60a61be",
  "folderId": 7986306,
  "buildRunId": "build_req_123_001",
  "pullRequestUrl": "https://github.com/AbhinavGupta707/Ui-Path-Agent-Factory/pull/123",
  "environment": "sandbox",
  "releaseApproval": {
    "approvalId": "appr_req_123_release_001",
    "decidedBy": "release-approver",
    "decidedAt": "2026-06-28T12:30:00.000Z"
  }
}
```

Success response:

```json
{
  "deploymentId": "deploy_req_123_001",
  "requestId": "req_123",
  "status": "deployed",
  "deploymentUrl": "https://example.invalid/customer360"
}
```

Data Service writes:

- Create or update `DeploymentRecord`.
- Set `AutomationRequest.status = "deployed"`.
- Write `AuditEvent.action = "deployment_completed"`.

## AgentFactory_SyncDataServiceRecord

Use this workflow when the Factory API remains the primary local state writer but
needs to mirror records into Data Service.

Inputs:

```json
{
  "operationId": "sync_req_123_automation_request_001",
  "requestId": "req_123",
  "entityName": "AutomationRequest",
  "upsertKey": "requestId",
  "record": {
    "requestId": "req_123",
    "status": "needs_clarification",
    "platformMode": "uipath-ready"
  }
}
```

Output:

```json
{
  "requestId": "req_123",
  "entityName": "AutomationRequest",
  "upserted": true,
  "recordId": "planned-data-service-record-id"
}
```

## Security And Secrets

- Store service endpoints and credentials as Orchestrator assets or Integration
  Service connections, not in this repository.
- Do not include bearer tokens or API keys in callback payloads.
- Use HTTPS endpoints for any live Checkpoint 4 worker calls.
- Restrict API Workflow permissions to the `AgentFactoryDemo` folder where
  possible.

## Checkpoint 4 Acceptance Criteria

- `AgentFactory_StartBuildWorker` can trigger a scaffold build run and record a
  queued/running/passed or failed status.
- `AgentFactory_PostStatusUpdate` can update Data Service and the local Factory
  API without duplicating events on retry.
- `AgentFactory_StartDeployment` only runs after release approval.
- Every workflow writes or causes an `AuditEvent`.
