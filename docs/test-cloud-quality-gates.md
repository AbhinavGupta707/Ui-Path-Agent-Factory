# Test Cloud Quality Gate Mapping

This is the planned Test Manager/Test Cloud mapping for Checkpoint 4. The
verified tenant currently has no Test Manager projects.

## Verified Context

| Field | Value |
|---|---|
| Organization | `galacticus` |
| Tenant | `DefaultTenant` |
| Folder | `AgentFactoryDemo` |
| Folder key | `cba41e19-47cc-4a0a-bf73-de88b60a61be` |
| Folder id | `7986306` |
| Planned Test Manager project | `Agent Factory Quality Gates` |

## Gate Model

Quality gates run after build completion and before release approval.

| Gate | Evidence source | Required for demo | Failure behavior |
|---|---|---|---|
| Workspace smoke | `npm run smoke` or scoped equivalent | Yes | Block release |
| Shared contract tests | Workspace test output | Yes | Block release |
| Factory API lifecycle tests | Workspace test output | Yes | Block release |
| Build worker manifest tests | Workspace test output | Yes | Block release |
| Generated app build | Build worker or CI | Yes after Checkpoint 3 | Block release |
| PII/data handling review | Governance Agent plus checklist | Yes | Block release unless release approver waives |
| Accessibility smoke | Console/generated dashboard checklist or automation | Preferred | Allow explicit waiver |
| Visual smoke | Factory Console/manual evidence | Preferred | Allow explicit waiver |

## Planned Test Manager Structure

| Artifact | Planned name |
|---|---|
| Project | `Agent Factory Quality Gates` |
| Test set | `Customer360 Release Gate` |
| Test case | `AF-QG-001 Workspace smoke passes` |
| Test case | `AF-QG-002 Shared contracts validate lifecycle payloads` |
| Test case | `AF-QG-003 Factory API creates intake and audit event` |
| Test case | `AF-QG-004 Build manifest triggers constrained Codex plan` |
| Test case | `AF-QG-005 Generated Customer360 dashboard builds` |
| Test case | `AF-QG-006 PII and permissions guardrail review passes` |
| Test case | `AF-QG-007 Release evidence is complete for approval` |

## TestRun Data Service Mapping

Each quality gate execution writes or updates `TestRun`:

| Field | Source |
|---|---|
| `testRunId` | Maestro or API Workflow generated id |
| `requestId` | `AutomationRequest.requestId` |
| `buildRunId` | `BuildRun.buildRunId` |
| `status` | Overall test execution status |
| `testManagerProjectId` | Live project id after Checkpoint 4 creation |
| `testSetId` | Live test set id after Checkpoint 4 creation |
| `automatedResultsUrl` | CI, Test Cloud, or local artifact URL |
| `smokeResult` | Result of smoke gate |
| `securityReviewResult` | PII/permission review result |
| `accessibilityResult` | Accessibility smoke result |
| `qualityGateDecision` | `pending`, `passed`, `failed`, or `waived` |
| `notes` | Test Summary Agent output |

## Release Approval Contract

Release approval must include:

- `buildRunId`
- `branchName`
- `pullRequestUrl`
- `logsUrl`
- `testRunId`
- `qualityGateDecision`
- Failed or waived gate details
- Deployment environment
- Rollback notes

If any required gate fails, Maestro must not create a release approval task
unless the route is explicitly a waiver approval. Waiver approvals must preserve
the failed gate evidence in `ApprovalTask.decisionJson` and `AuditEvent`.

## Test Summary Agent

The Test Summary Agent should read build/test logs and produce:

```json
{
  "requestId": "req_123",
  "buildRunId": "build_req_123_001",
  "testRunId": "test_req_123_001",
  "qualityGateDecision": "passed",
  "summary": "Workspace smoke, contract tests, API tests, and build worker tests passed.",
  "releaseRisks": [],
  "waiversRequested": []
}
```

The summary is advisory. Maestro and Data Service remain the source of truth for
gate status and release routing.

## Checkpoint 4 Acceptance Criteria

1. Test Manager project and test set exist, or the docs clearly record why Test
   Cloud access is unavailable.
2. One build run creates a `TestRun` record.
3. Release approval payload includes quality evidence.
4. A failed gate blocks deployment.
5. Waived gates require explicit release approval notes.
