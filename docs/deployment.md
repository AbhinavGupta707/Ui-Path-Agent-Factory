# Deployment

Checkpoint 5 provides a real local sandbox deployment contract for
`AgentFactory_StartDeployment`. It does not perform production deployment.

## Runtime Contract

`POST /deploy` is served by the Factory API on `http://localhost:8787`.
`AgentFactory_StartDeployment` calls it through the UiPath HTTP connector with
manual/no-auth local HTTP.

Required request fields:

```json
{
  "requestId": "REQ-2026-001",
  "buildRunId": "BUILD-REQ-2026-001-001",
  "environment": "sandbox",
  "releaseApproval": {
    "status": "approved",
    "approvalId": "appr_req_2026_001_release_001",
    "decidedBy": "release-approver"
  }
}
```

Idempotency is required through either:

- `operationId` in the JSON body, or
- `x-agent-factory-operation-id` HTTP header.

Retries must reuse the same value. Replays return the same deployment evidence
with `idempotentReplay: true`.

The endpoint returns:

```json
{
  "deploymentId": "DEP-REQ-2026-001-001",
  "operationId": "deploy_req_2026_001_001",
  "requestId": "REQ-2026-001",
  "buildRunId": "BUILD-REQ-2026-001-001",
  "environment": "sandbox",
  "deploymentStatus": "deployed",
  "deploymentUrl": "http://localhost:5174",
  "rollbackNotes": "Sandbox-only deployment; rollback by stopping the local app or redeploying the previous preview. Production is disabled.",
  "platformMode": "uipath-ready"
}
```

`platformMode` stays `uipath-ready` for the workflow asset until a real UiPath
Automation Cloud workflow execution is performed. It must not be changed to
`uipath-live` for local-only calls.

## Automation Cloud Callback Bridge

For Checkpoint 7, Maestro/API Workflow live execution must call an HTTPS
Factory API endpoint, not `localhost`. The approved operator can use a temporary
tunnel such as Cloudflare Tunnel or ngrok, or a hosted preview/service endpoint,
as long as no tunnel credentials, provider secrets, `.env` values, generated
`dist`, or auth files are committed.

Use the same Factory API host for:

- `AgentFactory_PostStatusUpdate.factoryApiBaseUrl`,
- `AgentFactory_RecordTestResult.factoryApiBaseUrl`,
- `AgentFactory_StartDeployment.deploymentServiceBaseUrl`.

The Build Worker can either share that bridge through a routed host or use a
separate approved HTTPS host for:

- `AgentFactory_StartBuildWorker.buildWorkerBaseUrl`,
- `AgentFactory_FetchBuildStatus.buildWorkerBaseUrl`.

Only the endpoint values are runtime configuration. The checked-in workflow JSON
keeps local defaults so local validation remains safe and repeatable.

## Local Sandbox Flow

Build and run the Factory API:

```bash
npm --workspace @agent-factory/factory-api run build
FACTORY_API_PORT=8787 npm run dev:api
```

Build and run the generated Customer360 dashboard:

```bash
npm --workspace @agent-factory/customer360-template run build
npm run dev:customer360
```

After the build run has reached `awaiting_release_approval`, record deployment
evidence:

```bash
curl -X POST http://localhost:8787/deploy \
  -H "content-type: application/json" \
  -H "x-agent-factory-operation-id: deploy_req_2026_001_001" \
  -d '{"requestId":"REQ-2026-001","platformMode":"uipath-ready","buildRunId":"BUILD-REQ-2026-001-001","environment":"sandbox","deploymentUrl":"http://localhost:5174","deploymentProvider":"local-sandbox","releaseApproval":{"status":"approved","approvalId":"appr_req_2026_001_release_001","decidedBy":"release-approver"}}'
```

For a `uipath-live` trusted bridge callback, set `AGENT_FACTORY_BRIDGE_TOKEN`
server-side and include:

```bash
-H "x-agent-factory-bridge-token: $AGENT_FACTORY_BRIDGE_TOKEN"
```

The helper prints the same commands without deploying by default:

```bash
node scripts/deploy-sandbox.mjs --target=customer360
```

## Vercel Preview

The root `vercel.json` is configured for the Customer360 dashboard preview:

```bash
npm --workspace @agent-factory/customer360-template run build
vercel deploy apps/customer360-template/dist --yes
```

To let the helper execute a non-production preview deploy:

```bash
AGENT_FACTORY_ALLOW_VERCEL_PREVIEW=true node scripts/deploy-sandbox.mjs --target=customer360 --vercel-preview --execute
```

After Vercel prints the preview URL, call `/deploy` with:

```json
{
  "environment": "sandbox",
  "deploymentProvider": "vercel-preview",
  "deploymentUrl": "https://<vercel-preview-url>"
}
```

No `.vercel` state, auth files, secrets, or generated `dist/**` output should
be committed.

## Production Guard

`environment: "production"` returns `403 production_deploy_disabled`. A
production path would require a separate explicit approval, live UiPath workflow
execution, production credentials in Orchestrator assets or Vercel project
settings, and a rollback plan outside this hackathon demo lane.
