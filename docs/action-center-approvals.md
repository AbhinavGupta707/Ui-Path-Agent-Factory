# Action Center Approval Mapping

Status: `uipath-ready`, proposal-only. No live Action Center tasks have been
created or completed in `AgentFactoryDemo`.

The import-ready source of truth for this lane is:

- `uipath/action-center/approval-contracts.json`
- `uipath/action-center/approval-contracts.schema.json`
- `uipath/action-center/validate-approval-contracts.mjs`

## Verified Context

| Field | Value |
|---|---|
| Organization | `galacticus` |
| Tenant | `DefaultTenant` |
| Folder | `AgentFactoryDemo` |
| Folder key | `cba41e19-47cc-4a0a-bf73-de88b60a61be` |
| Folder id | `7986306` |
| Last safe discovery | `2026-06-29T00:40:00Z` |

## Discovery Evidence

Read-only probes passed:

```bash
uip login status --output json
uip or folders get AgentFactoryDemo --output json
uip tasks list --folder-id 7986306 --limit 5 --output json
uip tasks --help --output json
uip tasks complete --help --output json
```

Results:

- Login is active for `galacticus / DefaultTenant`.
- `AgentFactoryDemo` resolved to folder id `7986306` and key
  `cba41e19-47cc-4a0a-bf73-de88b60a61be`.
- `uip tasks list --folder-id 7986306 --limit 5 --output json` returned an
  empty `Data` array.
- The installed `tasks` CLI supports `list`, `get`, `assign`, `reassign`,
  `unassign`, `complete`, and `users`; it does not expose a task creation
  command in this environment.

## Approval Types

| Approval type | Task title | Status before create | Primary route |
|---|---|---|---|
| `scope` | `Agent Factory Scope Approval` | `awaiting_scope_approval` | Maestro creates a FormTask or AppTask after the Governance Agent completes |
| `release` | `Agent Factory Release Approval` | `awaiting_release_approval` | Maestro creates a FormTask or AppTask after quality gates pass or a waiver is requested |

The scope approval is also the data-access approval. Its reviewer fields include
source systems, requested permissions, constraints, governance summary, risk
level, and blockers.

## Decision Outcomes

Use these outcomes for both approvals. The Action Center form should expose
`approved`, `rejected`, and `changes_requested`; Maestro may also set
`cancelled` or `expired` from process owner cancellation or timer escalation.

| Outcome | Scope transition | Release transition |
|---|---|---|
| `approved` | `awaiting_scope_approval` -> `approved_for_build` | `awaiting_release_approval` -> `deploying`, then `deployed` after deployment completes |
| `rejected` | `awaiting_scope_approval` -> `blocked` | `awaiting_release_approval` -> `blocked` |
| `changes_requested` | `awaiting_scope_approval` -> `clarifying` | `awaiting_release_approval` -> `approved_for_build` |
| `cancelled` | `awaiting_scope_approval` -> `cancelled` | `awaiting_release_approval` -> `cancelled` |
| `expired` | `awaiting_scope_approval` -> `blocked` after escalation | `awaiting_release_approval` -> `blocked` after escalation |

## Required Decision Payloads

Scope/Data approval completion must write:

```json
{
  "approvalId": "appr_req_123_scope_001",
  "approvalType": "scope",
  "requestId": "req_123",
  "decision": "approved",
  "decisionNotes": "Scope and data access are approved for sandbox build.",
  "approvedPermissions": ["read:crm_accounts", "read:product_usage"],
  "dataHandlingNotes": "Keep contact fields excluded from generated outputs.",
  "decidedBy": "Action Center approver",
  "decidedAt": "2026-06-29T00:00:00.000Z",
  "actionCenterTaskId": "task_123"
}
```

Release approval completion must write:

```json
{
  "approvalId": "appr_req_123_release_001",
  "approvalType": "release",
  "requestId": "req_123",
  "buildRunId": "build_req_123_001",
  "decision": "approved",
  "decisionNotes": "Quality gates passed and sandbox release is approved.",
  "approvedDeploymentTarget": "sandbox",
  "waiverReason": "",
  "decidedBy": "Action Center approver",
  "decidedAt": "2026-06-29T00:00:00.000Z",
  "actionCenterTaskId": "task_456"
}
```

`decisionNotes` is required for rejection, requested changes, or any waiver.
`approvedPermissions` is required for approved scope decisions.
`approvedDeploymentTarget` is required for approved release decisions.

## Data Service Mirror

On task creation:

- Create `ApprovalTask` with `status = "pending"`, `payloadJson`, `requestedBy`
  set to `maestro`, and `actionCenterTaskId` when the live task id is known.
- Set `AutomationRequest.currentApprovalId`.
- Set `AutomationRequest.status` to `awaiting_scope_approval` or
  `awaiting_release_approval`.
- Append `AuditEvent.action = "scope_approval_requested"` or
  `AuditEvent.action = "release_approval_requested"`.

On task completion:

- Update `ApprovalTask.status`, `decisionJson`, `decidedBy`, and `decidedAt`.
- Update `AutomationRequest.status` using the outcome table above.
- Append `AuditEvent.action = "scope_approval_decided"` or
  `AuditEvent.action = "release_approval_decided"`.
- If release is approved, Maestro calls `AgentFactory_StartDeployment`; only set
  `deployed` after the deployment URL and audit event are recorded.

## Live Setup Path

Task creation should be wired through the Maestro process or an Orchestrator
workflow/activity that creates FormTask or AppTask records from
`uipath/action-center/approval-contracts.json`.

When a live task is created after approval, capture the numeric
`actionCenterTaskId` in all three places:

- `ApprovalTask.actionCenterTaskId` when Data Service mirroring is approved,
- Factory API timeline/audit payload for the request,
- the final handoff evidence table for the demo run.

Do not mark a gate `uipath-live` until a real Action Center task id has been
observed through `uip tasks list` or `uip tasks get`.

Safe inspection commands:

```bash
uip tasks list --folder-id 7986306 --limit 5 --output json
uip tasks get <task-id> --task-type FormTask --folder-id 7986306 --output json
```

Commands that require explicit approval before use:

```bash
uip tasks complete <task-id> --type FormTask --folder-id 7986306 --action Approve --data '{"decision":"approved"}' --output json
```

The CLI can complete existing tasks, so completion is treated as a live business
decision and must not be run as part of unattended setup.

## Integration Notes

- Maestro owns state transitions and timer escalation.
- Data Service mirrors task payloads and decisions through `ApprovalTask`.
- API Workflow `AgentFactory_StartDeployment` is called only after release
  approval.
- Factory Console remains the polished primary UI; UiPath Apps may display task
  references and deep links, but Action Center remains the decision surface.
