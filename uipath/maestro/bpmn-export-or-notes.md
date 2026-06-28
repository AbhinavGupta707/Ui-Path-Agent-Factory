# Maestro BPMN Notes

Status: planned contract, not a live Maestro export.

Use this file with `uipath/maestro/process-contract.json` and
`docs/maestro-bpmn.md` when creating the Checkpoint 4 BPMN process.

## Verified Folder

- Organization: `galacticus`
- Tenant: `DefaultTenant`
- Folder: `AgentFactoryDemo`
- Folder key: `cba41e19-47cc-4a0a-bf73-de88b60a61be`
- Folder id: `7986306`

## Planned BPMN Process

Name: `Governed Agentic Automation Factory - Customer360 Build`

High-level flow:

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

Create the process only after Data Service entities and API Workflows exist.
The Maestro process should reference planned names from `docs/uipath-setup.md`
and should not use personal credentials or local `.env` values.
