# Action Center Approval Mapping

This is the planned Action Center mapping for Checkpoint 4. No Action Center
tasks have been created yet in `AgentFactoryDemo`.

## Verified Context

| Field | Value |
|---|---|
| Organization | `galacticus` |
| Tenant | `DefaultTenant` |
| Folder | `AgentFactoryDemo` |
| Folder key | `cba41e19-47cc-4a0a-bf73-de88b60a61be` |
| Folder id | `7986306` |

## Approval Types

| Approval type | Planned task title | Created by | Used when |
|---|---|---|---|
| `scope` | `Agent Factory Scope Approval` | Maestro after Governance Agent | Request has medium/high risk, sensitive permissions, blockers needing review, or human approval required |
| `release` | `Agent Factory Release Approval` | Maestro after quality gates pass | Generated dashboard is ready to deploy or publish |

## Decision Outcomes

Use these outcomes for both approval types:

| Outcome | Meaning | State transition |
|---|---|---|
| `approved` | Approver accepts the proposal | Scope: `approved_for_build`; release: deploy then `deployed` |
| `rejected` | Approver stops the request | `blocked` with rejection details |
| `changes_requested` | Approver asks for revised scope, build, or tests | Scope: `clarifying`; release: `approved_for_build` or `building` depending on required change |
| `cancelled` | Task was cancelled by process owner | `cancelled` unless manually re-opened |
| `expired` | SLA elapsed without decision | `blocked` or escalation route in Maestro |

## Scope Approval Payload

Create this task after `GovernanceAssessment` is complete and before
`BuildManifest` is finalized.

```json
{
  "approvalId": "appr_req_123_scope_001",
  "approvalType": "scope",
  "requestId": "req_123",
  "title": "Agent Factory Scope Approval",
  "request": {
    "title": "Build customer health dashboard",
    "requesterEmail": "owner@example.com",
    "businessGoal": "Give customer success leaders a renewal-risk cockpit.",
    "targetAudience": "Customer success leaders",
    "sourceSystems": ["CRM", "Product analytics"],
    "constraints": ["No personal contact fields in generated app"]
  },
  "structuredSpec": {
    "objective": "Build a Customer360 dashboard for renewal-risk review.",
    "requiredCapabilities": ["risk scoring", "account summary", "refresh timestamp"],
    "dataSources": ["CRM", "Product analytics"],
    "acceptanceCriteria": ["Dashboard builds", "Risk accounts are visible"]
  },
  "governance": {
    "riskLevel": "medium",
    "requiresHumanApproval": true,
    "requiredPermissions": ["read:crm_accounts", "read:product_usage"],
    "blockers": []
  },
  "decisionOptions": ["approved", "rejected", "changes_requested"]
}
```

Required form fields for the approver:

| Field | Type | Required |
|---|---|---|
| `decision` | Choice | Yes |
| `decisionNotes` | Long text | Required for `rejected` or `changes_requested` |
| `approvedPermissions` | Multi-select or text | Required for `approved` |
| `dataHandlingNotes` | Long text | Optional |

On completion:

1. Update `ApprovalTask.status`.
2. Write `ApprovalTask.decisionJson`.
3. Write `AuditEvent.action = "scope_approval_decided"`.
4. Update `AutomationRequest.status`.

## Release Approval Payload

Create this task after build completion and quality gates have passed or have an
explicit waiver request.

```json
{
  "approvalId": "appr_req_123_release_001",
  "approvalType": "release",
  "requestId": "req_123",
  "title": "Agent Factory Release Approval",
  "build": {
    "buildRunId": "build_req_123_001",
    "branchName": "factory/req-123",
    "outputApp": "apps/customer360-template",
    "logsUrl": "https://example.invalid/build-log",
    "pullRequestUrl": "https://github.com/AbhinavGupta707/Ui-Path-Agent-Factory/pull/123"
  },
  "qualityGate": {
    "testRunId": "test_req_123_001",
    "smokeResult": "passed",
    "securityReviewResult": "passed",
    "accessibilityResult": "passed",
    "qualityGateDecision": "passed"
  },
  "deployment": {
    "environment": "sandbox",
    "target": "Vercel or sandbox web host",
    "rollbackNotes": "Disable deployment alias and retain PR for audit."
  },
  "decisionOptions": ["approved", "rejected", "changes_requested"]
}
```

Required form fields for the approver:

| Field | Type | Required |
|---|---|---|
| `decision` | Choice | Yes |
| `decisionNotes` | Long text | Required for `rejected`, `changes_requested`, or any waiver |
| `approvedDeploymentTarget` | Text | Required for `approved` |
| `waiverReason` | Long text | Required if any gate is waived |

On completion:

1. Update `ApprovalTask.status`.
2. Write `AuditEvent.action = "release_approval_decided"`.
3. If approved, call `AgentFactory_StartDeployment`.
4. If rejected, set `AutomationRequest.status = "blocked"` with rejection details.
5. If changes are requested, route back to build planning or build execution.

## SLA And Escalation

| Approval | Initial SLA | Escalation |
|---|---|---|
| Scope approval | 4 business hours for demo | Notify process owner or route to manual review |
| Release approval | 2 business hours for demo | Notify release owner and keep deployment blocked |

For the hackathon demo, the approver can be a configured demo user or group.
Do not hard-code personal email addresses in source-controlled assets.

## Audit Requirements

Each task creation and completion must write an `AuditEvent`:

- `scope_approval_requested`
- `scope_approval_decided`
- `release_approval_requested`
- `release_approval_decided`

The audit payload should include task id, approval id, decision, decision notes,
approver display name, and timestamp. Do not include credentials or private
tokens.
