# Maestro BPMN Mapping

This is the Checkpoint 7 Maestro implementation guide for the Customer360
request-to-release lifecycle. A validated, import-ready BPMN project exists in
the repo, but no live Maestro process has been published or run yet.

## Process Identity

| Field | Value |
|---|---|
| Planned process name | `Governed Agentic Automation Factory - Customer360 Build` |
| Organization | `galacticus` |
| Tenant | `DefaultTenant` |
| Folder | `AgentFactoryDemo` |
| Folder key | `cba41e19-47cc-4a0a-bf73-de88b60a61be` |
| Folder id | `7986306` |
| Current status | Import-ready, not published |
| BPMN project | `uipath/maestro/customer360-build` |
| BPMN source | `uipath/maestro/customer360-build/agent-factory-customer360-build.bpmn` |
| Entry point | `Event_RequestSubmitted` |
| Entry point unique id | `9c7261e3-6e10-4e21-97b5-e45d6632bc11` |

## Checkpoint 7 Live Activation Plan

Maestro is the primary Track 2 target for Agent Factory. The local BPMN is the
source-controlled process spine, and Automation Cloud live mode begins only
after these prerequisites are true:

1. Registration/discovery passes for login, tenant, folder, Maestro, API
   Workflow, Action Center, Data Service, and Test Manager surfaces.
2. Factory API and Build Worker are reachable from Automation Cloud through an
   approved HTTPS host or tunnel. Do not use `localhost` for live callbacks.
3. API Workflow inputs are overridden with the approved endpoint values:
   `buildWorkerBaseUrl`, `factoryApiBaseUrl`, and
   `deploymentServiceBaseUrl`.
4. Scope and release approval task schemas are confirmed from
   `uipath/action-center/approval-contracts.json`.
5. Data Service mirroring remains stretch evidence until schema creation and
   record writes are explicitly approved.
6. The operator approves the exact `uip maestro bpmn publish` or
   `uip maestro bpmn run` command before it is executed.

Live ids to capture back into Factory API timeline events:

| Evidence | Field name to preserve in timeline/audit payloads |
|---|---|
| Maestro process | `maestroProcessId` |
| Maestro run/process instance | `maestroRunId` |
| API Workflow handoff | `apiWorkflowExecutionId` |
| Scope/release human gate | `actionCenterTaskId` |
| Data Service mirror rows | `dataServiceRecordId` |
| Test Manager/Test Cloud run | `testExecutionId` |

## State Map

The Maestro process should drive the same statuses defined in
`packages/shared-contracts/src/index.ts`.

| Local/API status | Data Service field | Maestro stage | Primary UiPath asset | Exit condition |
|---|---|---|---|---|
| `draft` | `AutomationRequest.requestStatus` | Request prepared | Factory Console or UiPath Apps | Required intake fields are present |
| `clarifying` | `AutomationRequest.requestStatus` | Requirements clarification | Requirements Agent, Clarification Agent | All required answers are captured |
| `awaiting_scope_approval` | `AutomationRequest.requestStatus` | Governance and scope assessment | Governance Agent, Data Service, Action Center | Risk, permissions, and approval need are evaluated |
| `approved_for_build` | `AutomationRequest.requestStatus` | Scope approval complete | Action Center, Build Planner Agent | Human approval is granted or low-risk request is auto-approved |
| `manifest_created` | `AutomationRequest.requestStatus` | Manifest ready | Build Planner Agent, Data Service | Manifest is validated and ready to queue |
| `build_queued` | `BuildRun.buildRunStatus` | Build queued | API Workflow, Build Worker | Build worker accepts the manifest |
| `building` | `BuildRun.buildRunStatus` | Build execution | API Workflow, Build Worker, Codex | Build worker reports progress or failure |
| `build_failed` | `BuildRun.buildRunStatus` | Build remediation | API Workflow, Build Worker, Codex | Retry is exhausted or remediation is required |
| `tests_running` | `TestRun.testRunStatus` | Quality gate execution | API Workflow, Test Manager/Test Cloud | Required gates produce a pass/fail decision |
| `tests_failed` | `TestRun.testRunStatus` | Quality gate remediation | Test Manager/Test Cloud, Action Center | Failed evidence is remediated or waived |
| `awaiting_release_approval` | `AutomationRequest.requestStatus` | Release decision | Action Center | Release approver accepts, rejects, or requests changes |
| `deploying` | `DeploymentRecord.deploymentStatus` | Sandbox deployment | API Workflow, Orchestrator | Deployment operation is running |
| `deployed` | `DeploymentRecord.deploymentStatus` | Deployment and audit closeout | API Workflow, Orchestrator, Data Service | Deployment URL and audit summary are recorded |
| `blocked` | `AutomationRequest.requestStatus` | Exception or rejection hold | Maestro boundary event, Action Center, Data Service | Human action or remediation is required |
| `cancelled` | `AutomationRequest.requestStatus` | Cancellation closeout | Maestro, Data Service | Requester or process owner cancels the request |

## BPMN Lane Model

| Lane | Responsibilities |
|---|---|
| Requester | Submit intake, answer clarification questions, review status |
| Factory Console / UiPath Apps | Capture intake, display state, collect responses |
| Maestro | Own process routing, gateways, waits, retries, and audit checkpoints |
| UiPath Agents | Turn natural language into structured spec, governance assessment, build plan, and test summary |
| Action Center | Hold scope approval and release approval decisions |
| API Workflows | Trigger build/deploy worker calls and status callbacks |
| Build Worker / Codex | Generate the Customer360 dashboard from a constrained manifest |
| Test Manager / Test Cloud | Record automated and manual quality gate evidence |
| Data Service | Persist request, spec, approvals, build, test, deployment, and audit records |

## BPMN Flow

1. **Start Event: Request Submitted**
   - Triggered by Factory Console `POST /api/intake` in Checkpoint 1.
   - Triggered by UiPath Apps or API Workflow in Checkpoint 4.
   - Create or upsert `AutomationRequest`.
   - Write `AuditEvent.action = "intake_created"`.

2. **Service Task: Normalize Intake**
   - Validate title, requester email, business goal, target audience, source systems, constraints, and due date.
   - Set `AutomationRequest.requestStatus = "clarifying"`.

3. **Agent Task: Requirements Agent**
   - Produces `StructuredSpec`.
   - Uses the source systems and constraints as strict inputs.
   - Writes `AuditEvent.action = "structured_spec_created"`.

4. **Exclusive Gateway: Clarification Needed?**
   - If required capability, data source, audience, due date, or acceptance criteria are missing, route to the clarification loop.
   - Otherwise continue to governance.

5. **User Task: Capture Clarifications**
   - Surface questions in Factory Console as primary UI.
   - Mirror the task in UiPath Apps where available.
   - Persist answers back into the `StructuredSpec`.
   - Return to the Requirements Agent if answers materially alter scope.

6. **Agent Task: Governance Agent**
   - Produces `GovernanceAssessment`.
   - Sets risk level, required permissions, blockers, and whether human approval is required.
   - Set `AutomationRequest.requestStatus = "awaiting_scope_approval"`.

7. **Exclusive Gateway: Blocked Or Approval Required?**
   - If blockers exist, route to rejection closeout or changes requested.
   - If `requiresHumanApproval = true`, create an Action Center scope approval task.
   - If low-risk and no approval is required, continue to build planning.

8. **Action Center Task: Scope Approval**
   - Planned task name: `Agent Factory Scope Approval`.
   - Approver decides `approved`, `rejected`, or `changes_requested`.
   - Approved sets `AutomationRequest.requestStatus = "approved_for_build"`.
   - Rejected sets `AutomationRequest.requestStatus = "blocked"` with rejection details.
   - Changes requested returns to clarification.

9. **Agent Task: Build Planner Agent**
   - Produces `BuildManifest` with template `customer360-dashboard`.
   - Confirms branch name, output app, permissions, acceptance criteria, and Codex model.
   - Set `AutomationRequest.requestStatus = "manifest_created"`.
   - Writes `AuditEvent.action = "build_manifest_created"`.

10. **Service Task: Trigger Build Worker**
   - Calls API Workflow `AgentFactory_StartBuildWorker`.
   - Set `AutomationRequest.requestStatus = "build_queued"` and create `BuildRun.buildRunStatus = "build_queued"`.
   - Move to `AutomationRequest.requestStatus = "building"` and `BuildRun.buildRunStatus = "building"` when the worker reports `building`.

11. **Intermediate Event: Build Status Callback**
   - API Workflow `AgentFactory_PostStatusUpdate` updates build progress.
   - On failure, set `AutomationRequest.requestStatus = "build_failed"` and route to retry or remediation.
   - On success, store logs URL, pull request URL, and artifact details.

12. **Service Task: Run Quality Gates**
   - Set `AutomationRequest.requestStatus = "tests_running"` and `TestRun.testRunStatus = "running"`.
   - Run local smoke/test commands through the worker or CI.
   - Record Test Manager/Test Cloud results when available.

13. **Exclusive Gateway: Quality Gate Passed?**
    - If failed, set `AutomationRequest.requestStatus = "tests_failed"` and route to remediation or waiver handling.
    - If passed, set `AutomationRequest.requestStatus = "awaiting_release_approval"`.

14. **Action Center Task: Release Approval**
    - Planned task name: `Agent Factory Release Approval`.
    - Approver sees diff, test results, deployment target, known risks, and rollback notes.
    - Approved triggers deployment.
    - Rejected sets `AutomationRequest.requestStatus = "blocked"` with release rejection details.
    - Changes requested returns to build planning or build execution.

15. **Service Task: Deploy Sandbox Artifact**
   - Calls API Workflow `AgentFactory_StartDeployment`.
   - Set `AutomationRequest.requestStatus = "deploying"`.
   - Stores `DeploymentRecord`.
   - Set `AutomationRequest.requestStatus = "deployed"` only after a URL is recorded.

16. **End Event: Audit Summary Published**
    - Create an audit event with final URLs and decision trail.
    - Factory Console and UiPath Apps show the final state.

## Boundary And Error Handling

| Error source | BPMN handling | Data Service update |
|---|---|---|
| Invalid intake | Return validation error to caller | No request record, or `blocked` if created |
| Agent output fails schema validation | Retry once with validation error context | Audit `agent_schema_retry` |
| Scope approval rejected | End as blocked | `AutomationRequest.requestStatus = "blocked"` |
| Build worker timeout | Timer boundary event, one retry | `BuildRun.buildRunStatus = "build_failed"` after retry |
| Tests fail | Route to remediation or release block | `TestRun.testRunStatus = "failed"` |
| Release approval rejected | End as blocked | `AutomationRequest.requestStatus = "blocked"` |
| Deployment fails | Retry if idempotent, otherwise failed closeout | `DeploymentRecord.deploymentStatus = "failed"` |

## Audit Events

Maestro should write these audit actions at minimum:

- `intake_created`
- `structured_spec_created`
- `clarification_requested`
- `clarification_answered`
- `governance_assessed`
- `scope_approval_requested`
- `scope_approval_decided`
- `build_manifest_created`
- `build_started`
- `build_status_updated`
- `quality_gate_started`
- `quality_gate_completed`
- `release_approval_requested`
- `release_approval_decided`
- `deployment_started`
- `deployment_completed`
- `request_blocked`
- `request_cancelled`

## Checkpoint 4 Acceptance Criteria

- The BPMN source validates locally with `uip maestro bpmn validate`.
- After explicit approval, the Maestro process can be published in
  `AgentFactoryDemo`.
- A single Customer360 request can move from intake to release approval.
- Data Service records are updated at each major state transition.
- Action Center creates both approval types when the route requires them.
- API Workflow status callbacks update `BuildRun` and `AuditEvent`.
- Factory Console remains the polished primary UI; UiPath Apps mirrors intake and status.

## Checkpoint 4 Validation

The import-ready BPMN source was validated with:

```bash
uip maestro bpmn validate uipath/maestro/customer360-build/agent-factory-customer360-build.bpmn --output json
```

Result: valid, with one process, one start event, and three UiPath extension
elements.
