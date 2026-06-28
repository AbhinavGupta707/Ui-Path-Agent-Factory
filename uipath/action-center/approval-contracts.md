# Action Center Approval Contracts

Status: planned contract, not live-created Action Center tasks.

## Folder

- Organization: `galacticus`
- Tenant: `DefaultTenant`
- Folder: `AgentFactoryDemo`
- Folder key: `cba41e19-47cc-4a0a-bf73-de88b60a61be`
- Folder id: `7986306`

## Scope Approval

Task title: `Agent Factory Scope Approval`

Create when:

- `GovernanceAssessment.requiresHumanApproval = true`
- `GovernanceAssessment.riskLevel` is `medium` or `high`
- `GovernanceAssessment.blockers` contains a non-empty array

Minimum payload:

```json
{
  "approvalId": "appr_req_123_scope_001",
  "approvalType": "scope",
  "requestId": "req_123",
  "requestTitle": "Build customer health dashboard",
  "requesterEmail": "owner@example.com",
  "businessGoal": "Give customer success leaders a renewal-risk cockpit.",
  "targetAudience": "Customer success leaders",
  "sourceSystems": ["CRM", "Product analytics"],
  "constraints": ["No personal contact fields in generated app"],
  "riskLevel": "medium",
  "requiresHumanApproval": true,
  "requiredPermissions": ["read:crm_accounts", "read:product_usage"],
  "blockers": [],
  "acceptanceCriteria": ["Dashboard builds", "Risk accounts are visible"]
}
```

Decisions:

- `approved`: set request to `approved_for_build`.
- `rejected`: set request to `rejected`.
- `changes_requested`: set request to `needs_clarification`.
- `cancelled` or `expired`: route through Maestro exception handling.

## Release Approval

Task title: `Agent Factory Release Approval`

Create when:

- `BuildRun.status = "passed"`
- `TestRun.qualityGateDecision = "passed"` or an explicit waiver is requested
- Deployment has not already been completed for the same build run

Minimum payload:

```json
{
  "approvalId": "appr_req_123_release_001",
  "approvalType": "release",
  "requestId": "req_123",
  "buildRunId": "build_req_123_001",
  "branchName": "factory/req-123",
  "outputApp": "apps/customer360-template",
  "logsUrl": "https://example.invalid/build-log",
  "pullRequestUrl": "https://github.com/AbhinavGupta707/Ui-Path-Agent-Factory/pull/123",
  "testRunId": "test_req_123_001",
  "qualityGateDecision": "passed",
  "deploymentEnvironment": "sandbox"
}
```

Decisions:

- `approved`: call deployment workflow and then set request to `deployed`.
- `rejected`: set request to `rejected`.
- `changes_requested`: route back to build planning or build execution.
- `cancelled` or `expired`: route through Maestro exception handling.

## Data Service Writes

On task creation:

- Create `ApprovalTask`.
- Set `ApprovalTask.status = "pending"`.
- Set `AutomationRequest.currentApprovalId`.
- Write `AuditEvent.action = "scope_approval_requested"` or
  `AuditEvent.action = "release_approval_requested"`.

On task completion:

- Update `ApprovalTask.status`.
- Set `ApprovalTask.decisionJson`.
- Set `ApprovalTask.decidedBy` and `ApprovalTask.decidedAt`.
- Update `AutomationRequest.status`.
- Write the matching `*_approval_decided` audit event.
