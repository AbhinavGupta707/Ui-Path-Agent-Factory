# Action Center Approval Contracts

Status: `uipath-ready`, proposal-only. No live Action Center tasks were created,
assigned, completed, or cancelled by this lane.

Machine-readable assets:

- `approval-contracts.json`
- `approval-contracts.schema.json`
- `validate-approval-contracts.mjs`

## Folder

| Field | Value |
|---|---|
| Organization | `galacticus` |
| Tenant | `DefaultTenant` |
| Folder | `AgentFactoryDemo` |
| Folder key | `cba41e19-47cc-4a0a-bf73-de88b60a61be` |
| Folder id | `7986306` |

## Scope/Data Approval

Task title: `Agent Factory Scope Approval`

Create when any of these are true:

- `GovernanceAssessment.requiresHumanApproval = true`
- `GovernanceAssessment.riskLevel` is `medium` or `high`
- `GovernanceAssessment.blockersJson` contains one or more blockers

Reviewer-visible groups:

| Group | Fields |
|---|---|
| Request | title, requester, business goal, target audience |
| Structured spec | objective, required capabilities, acceptance criteria |
| Data access | source systems, requested permissions, data handling constraints |
| Governance | risk level, policy summary, blockers |

Required decision fields:

| Field | Requirement |
|---|---|
| `decision` | One of `approved`, `rejected`, `changes_requested` |
| `decisionNotes` | Required for `rejected` or `changes_requested` |
| `approvedPermissions` | Required and non-empty for `approved` |
| `dataHandlingNotes` | Optional |

State transitions:

| Decision | `ApprovalTask.status` | `AutomationRequest.status` |
|---|---|---|
| `approved` | `approved` | `approved_for_build` |
| `rejected` | `rejected` | `blocked` |
| `changes_requested` | `changes_requested` | `clarifying` |
| `cancelled` | `cancelled` | `cancelled` |
| `expired` | `expired` | `blocked` after escalation |

## Release Approval

Task title: `Agent Factory Release Approval`

Create when:

- A build has completed successfully for the request.
- `TestRun.qualityGateDecision` is `passed` or a waiver is explicitly requested.
- The same `buildRunId` has not already been deployed.

Reviewer-visible groups:

| Group | Fields |
|---|---|
| Build | build run id, branch, output app, logs URL, pull request URL |
| Quality | test run id, smoke, security, accessibility, quality gate decision |
| Deployment | environment, target, rollback notes |

Required decision fields:

| Field | Requirement |
|---|---|
| `decision` | One of `approved`, `rejected`, `changes_requested` |
| `decisionNotes` | Required for `rejected`, `changes_requested`, or waived gates |
| `approvedDeploymentTarget` | Required for `approved` |
| `waiverReason` | Required when any quality gate is waived |

State transitions:

| Decision | `ApprovalTask.status` | `AutomationRequest.status` |
|---|---|---|
| `approved` | `approved` | `deploying`, then `deployed` after deployment completes |
| `rejected` | `rejected` | `blocked` |
| `changes_requested` | `changes_requested` | `approved_for_build` |
| `cancelled` | `cancelled` | `cancelled` |
| `expired` | `expired` | `blocked` after escalation |

## Data Service Writes

On task creation:

- Create `ApprovalTask`.
- Set `ApprovalTask.status = "pending"`.
- Store the full task payload in `ApprovalTask.payloadJson`.
- Store the live Action Center id in `ApprovalTask.actionCenterTaskId` once
  created.
- Set `AutomationRequest.currentApprovalId`.
- Write `scope_approval_requested` or `release_approval_requested` to
  `AuditEvent`.

On task completion:

- Update `ApprovalTask.status`.
- Set `ApprovalTask.decisionJson`, `ApprovalTask.decidedBy`, and
  `ApprovalTask.decidedAt`.
- Update `AutomationRequest.status`.
- Write `scope_approval_decided` or `release_approval_decided` to `AuditEvent`.

## Live Commands

Safe inspection:

```bash
uip tasks list --folder-id 7986306 --limit 5 --output json
uip tasks get <task-id> --task-type FormTask --folder-id 7986306 --output json
```

Completion requires explicit approval:

```bash
uip tasks complete <task-id> --type FormTask --folder-id 7986306 --action Approve --data '{"decision":"approved"}' --output json
```

The installed `tasks` CLI does not expose a creation command. Live task creation
should happen through Maestro or an Orchestrator workflow/activity using the
payloads in `approval-contracts.json`.
