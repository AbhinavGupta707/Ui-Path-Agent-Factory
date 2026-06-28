# Maestro BPMN Mapping

This is the planned Maestro implementation guide for the Checkpoint 1 local
lifecycle. No live Maestro process exists yet.

## Process Identity

| Field | Value |
|---|---|
| Planned process name | `Governed Agentic Automation Factory - Customer360 Build` |
| Organization | `galacticus` |
| Tenant | `DefaultTenant` |
| Folder | `AgentFactoryDemo` |
| Folder key | `cba41e19-47cc-4a0a-bf73-de88b60a61be` |
| Folder id | `7986306` |
| Current status | Planned for Checkpoint 4 |

## State Map

The Maestro process should drive the same statuses defined in
`packages/shared-contracts/src/index.ts`.

| Local/API status | Maestro stage | Primary UiPath asset | Exit condition |
|---|---|---|---|
| `draft` | Request prepared | Factory Console or UiPath Apps | Required intake fields are present |
| `needs_clarification` | Requirements clarification | Requirements Agent, Clarification Agent | All required answers are captured |
| `awaiting_governance` | Governance assessment | Governance Agent, Data Service | Risk and permissions are evaluated |
| `approved_for_build` | Scope approval complete | Action Center, Build Planner Agent | Human approval is granted or low-risk request is auto-approved |
| `building` | Build execution | API Workflow, Build Worker, Codex | Build worker reports `passed` or `failed` |
| `testing` | Quality gate execution | API Workflow, Test Manager/Test Cloud | Required gates produce a pass/fail decision |
| `awaiting_release_approval` | Release decision | Action Center | Release approver accepts, rejects, or requests changes |
| `deployed` | Deployment and audit closeout | API Workflow, Orchestrator, Data Service | Deployment URL and audit summary are recorded |
| `rejected` | Rejection closeout | Action Center, Data Service | Scope or release rejection is recorded |
| `failed` | Exception closeout | Maestro boundary event, Data Service | Recoverable retry exhausted or terminal error recorded |

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
   - Set `AutomationRequest.status = "needs_clarification"`.

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
   - Set `AutomationRequest.status = "awaiting_governance"`.

7. **Exclusive Gateway: Blocked Or Approval Required?**
   - If blockers exist, route to rejection closeout or changes requested.
   - If `requiresHumanApproval = true`, create an Action Center scope approval task.
   - If low-risk and no approval is required, continue to build planning.

8. **Action Center Task: Scope Approval**
   - Planned task name: `Agent Factory Scope Approval`.
   - Approver decides `approved`, `rejected`, or `changes_requested`.
   - Approved sets `AutomationRequest.status = "approved_for_build"`.
   - Rejected sets `AutomationRequest.status = "rejected"`.
   - Changes requested returns to clarification.

9. **Agent Task: Build Planner Agent**
   - Produces `BuildManifest` with template `customer360-dashboard`.
   - Confirms branch name, output app, permissions, acceptance criteria, and Codex model.
   - Writes `AuditEvent.action = "build_manifest_created"`.

10. **Service Task: Trigger Build Worker**
    - Calls API Workflow `AgentFactory_StartBuildWorker`.
    - Set `AutomationRequest.status = "building"`.
    - Create `BuildRun.status = "queued"` then `running`.

11. **Intermediate Event: Build Status Callback**
    - API Workflow `AgentFactory_PostStatusUpdate` updates build progress.
    - On failure, route to retry or failed closeout.
    - On success, store logs URL, pull request URL, and artifact details.

12. **Service Task: Run Quality Gates**
    - Set `AutomationRequest.status = "testing"`.
    - Run local smoke/test commands through the worker or CI.
    - Record Test Manager/Test Cloud results when available.

13. **Exclusive Gateway: Quality Gate Passed?**
    - If failed, route to remediation or failed closeout.
    - If passed, set `AutomationRequest.status = "awaiting_release_approval"`.

14. **Action Center Task: Release Approval**
    - Planned task name: `Agent Factory Release Approval`.
    - Approver sees diff, test results, deployment target, known risks, and rollback notes.
    - Approved triggers deployment.
    - Rejected sets `AutomationRequest.status = "rejected"`.
    - Changes requested returns to build planning or build execution.

15. **Service Task: Deploy Sandbox Artifact**
    - Calls API Workflow `AgentFactory_StartDeployment`.
    - Stores `DeploymentRecord`.
    - Set `AutomationRequest.status = "deployed"` only after a URL is recorded.

16. **End Event: Audit Summary Published**
    - Create an audit event with final URLs and decision trail.
    - Factory Console and UiPath Apps show the final state.

## Boundary And Error Handling

| Error source | BPMN handling | Data Service update |
|---|---|---|
| Invalid intake | Return validation error to caller | No request record, or `failed` if created |
| Agent output fails schema validation | Retry once with validation error context | Audit `agent_schema_retry` |
| Scope approval rejected | End as rejected | `AutomationRequest.status = "rejected"` |
| Build worker timeout | Timer boundary event, one retry | `BuildRun.status = "failed"` after retry |
| Tests fail | Route to remediation or release block | `TestRun.status = "failed"` |
| Release approval rejected | End as rejected | `AutomationRequest.status = "rejected"` |
| Deployment fails | Retry if idempotent, otherwise failed closeout | `DeploymentRecord.status = "failed"` |

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
- `request_rejected`
- `request_failed`

## Checkpoint 4 Acceptance Criteria

- The Maestro process is created in `AgentFactoryDemo`.
- A single Customer360 request can move from intake to release approval.
- Data Service records are updated at each major state transition.
- Action Center creates both approval types when the route requires them.
- API Workflow status callbacks update `BuildRun` and `AuditEvent`.
- Factory Console remains the polished primary UI; UiPath Apps mirrors intake and status.
