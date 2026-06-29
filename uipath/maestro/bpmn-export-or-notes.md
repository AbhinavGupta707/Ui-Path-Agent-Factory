# Maestro BPMN Import Notes

Status: import-ready Maestro source, not a live Maestro export and not a
published process.

Use this file with `uipath/maestro/process-contract.json`,
`uipath/maestro/customer360-build/`, and `docs/maestro-bpmn.md` when creating
the Checkpoint 4 BPMN process.

## Verified Folder

- Organization: `galacticus`
- Tenant: `DefaultTenant`
- Folder: `AgentFactoryDemo`
- Folder key: `cba41e19-47cc-4a0a-bf73-de88b60a61be`
- Folder id: `7986306`

## Planned BPMN Process

Name: `Governed Agentic Automation Factory - Customer360 Build`

Source of record:

- Project: `uipath/maestro/customer360-build`
- BPMN: `uipath/maestro/customer360-build/agent-factory-customer360-build.bpmn`
- Entry point: `Event_RequestSubmitted`
- Entry point unique id: `9c7261e3-6e10-4e21-97b5-e45d6632bc11`
- Correlation key: `AutomationRequest.requestId`

High-level flow in the BPMN:

```text
Start: request submitted
  -> Normalize intake
  -> Requirements Agent
  -> Clarification gateway
  -> Capture clarifications when needed
  -> Governance Agent
  -> Governance gateway
  -> Scope approval when required
  -> Build Planner Agent
  -> Start Build Worker API Workflow
  -> Wait for build status
  -> Run quality gates
  -> Quality gate gateway
  -> Release approval
  -> Deploy sandbox artifact
  -> Publish audit summary
  -> End
```

## BPMN Implementation Notes

- Model requester interactions as user tasks even when the Factory Console is
  the primary UI. In Checkpoint 4, UiPath Apps can mirror those tasks.
- Use explicit exclusive gateways for clarification required, governance
  approval required, quality gate passed, and release decision.
- Use timer boundary events on build and deploy worker waits.
- Use Data Service writes after each state transition, not only at process end.
- Store external URLs as Data Service fields and in audit payload JSON:
  `logsUrl`, `pullRequestUrl`, `deploymentUrl`, and `testReportUrl`.
- Keep a correlation key equal to `AutomationRequest.requestId`.
- Use Data Service fields with domain-safe names: `requestStatus`,
  `approvalStatus`, `buildRunStatus`, `testRunStatus`, and
  `deploymentStatus`. Do not rely on a bare field named `status`.
- Do not publish or run this process until the Data Service schema is approved
  and the downstream API Workflow/Action Center assets exist or are explicitly
  approved for live creation.
- For Checkpoint 7 live mode, replace local workflow endpoints with approved
  HTTPS callback URLs before publish/run:
  `buildWorkerBaseUrl`, `factoryApiBaseUrl`, and
  `deploymentServiceBaseUrl`.
- Capture live evidence ids in the Factory API timeline when the process runs:
  Maestro process/run ids, API Workflow execution id, Action Center task id,
  Data Service record id, and Test Manager/Test Cloud execution id when
  available.

## Validation

The BPMN source validated locally with:

```bash
uip maestro bpmn validate uipath/maestro/customer360-build/agent-factory-customer360-build.bpmn --output json
```

Result:

```json
{
  "Status": "Valid",
  "ProcessCount": 1,
  "StartEventCount": 1,
  "UiPathExtensionCount": 3
}
```

## Minimum Data Objects

- `AutomationRequest`
- `StructuredSpec`
- `GovernanceAssessment`
- `ApprovalTask`
- `BuildManifest`
- `BuildRun`
- `TestRun`
- `DeploymentRecord`
- `AuditEvent`

## Handoff To Platform Builder

Create or publish the process only after Data Service entities and API
Workflows exist, or after explicit approval for the required live mutation.
The Maestro process should reference planned names from `docs/uipath-setup.md`
and should not use personal credentials or local `.env` values.
