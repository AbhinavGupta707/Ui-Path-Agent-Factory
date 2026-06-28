# API Workflow Contracts

Status: planned contracts, not live-created API Workflows.

## Workflows

| Name | Purpose |
|---|---|
| `AgentFactory_StartBuildWorker` | Trigger the build worker from a `BuildManifest` |
| `AgentFactory_PostStatusUpdate` | Persist status callbacks into Factory API/Data Service |
| `AgentFactory_StartDeployment` | Deploy the approved sandbox artifact |
| `AgentFactory_SyncDataServiceRecord` | Upsert local lifecycle state into Data Service |

## Common Required Fields

```json
{
  "operationId": "unique-idempotency-key",
  "requestId": "req_123",
  "platformMode": "uipath-live",
  "folderKey": "cba41e19-47cc-4a0a-bf73-de88b60a61be",
  "folderId": 7986306
}
```

Retries must reuse the same `operationId`.

## Start Build Worker

Planned endpoint: `POST /build`

Input:

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
  }
}
```

Output:

```json
{
  "buildRunId": "build_req_123_001",
  "requestId": "req_123",
  "status": "queued"
}
```

## Post Status Update

Planned endpoint: `POST /api/uipath/status`

Input:

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
    "logsUrl": "https://example.invalid/build-log"
  },
  "audit": {
    "actor": "build-worker",
    "summary": "Codex build status updated."
  }
}
```

Output:

```json
{
  "requestId": "req_123",
  "accepted": true,
  "updatedStatus": "building"
}
```

## Start Deployment

Planned endpoint: `POST /deploy`

Input:

```json
{
  "operationId": "deploy_req_123_001",
  "requestId": "req_123",
  "platformMode": "uipath-live",
  "folderKey": "cba41e19-47cc-4a0a-bf73-de88b60a61be",
  "folderId": 7986306,
  "buildRunId": "build_req_123_001",
  "environment": "sandbox",
  "releaseApproval": {
    "approvalId": "appr_req_123_release_001",
    "decidedBy": "release-approver"
  }
}
```

Output:

```json
{
  "deploymentId": "deploy_req_123_001",
  "requestId": "req_123",
  "status": "deployed",
  "deploymentUrl": "https://example.invalid/customer360"
}
```

## Sync Data Service Record

Input:

```json
{
  "operationId": "sync_req_123_automation_request_001",
  "requestId": "req_123",
  "entityName": "AutomationRequest",
  "upsertKey": "requestId",
  "record": {
    "requestId": "req_123",
    "status": "clarifying",
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

## Checkpoint 4 Notes

- The Checkpoint 1 build worker currently exposes scaffold behavior only.
- Add the planned endpoints before wiring live API Workflows.
- Store endpoint URLs and credentials in Orchestrator assets or Integration
  Service connections.
- Every workflow invocation should append an `AuditEvent`.
