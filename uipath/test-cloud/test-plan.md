# Test Manager And Test Cloud Plan

Status: planned contract, not a live Test Manager project.

## Planned Project

- Project: `Agent Factory Quality Gates`
- Test set: `Customer360 Release Gate`
- Folder: `AgentFactoryDemo`
- Folder key: `cba41e19-47cc-4a0a-bf73-de88b60a61be`
- Folder id: `7986306`

## Quality Gates

| ID | Name | Required |
|---|---|---|
| `AF-QG-001` | Workspace smoke passes | Yes |
| `AF-QG-002` | Shared contracts validate lifecycle payloads | Yes |
| `AF-QG-003` | Factory API creates intake and audit event | Yes |
| `AF-QG-004` | Build manifest triggers constrained Codex plan | Yes |
| `AF-QG-005` | Generated Customer360 dashboard builds | Yes after Checkpoint 3 |
| `AF-QG-006` | PII and permissions guardrail review passes | Yes |
| `AF-QG-007` | Release evidence is complete for approval | Yes |

## Data Service Result Shape

```json
{
  "testRunId": "test_req_123_001",
  "requestId": "req_123",
  "buildRunId": "build_req_123_001",
  "status": "passed",
  "testManagerProjectId": "planned-project-id",
  "testSetId": "planned-test-set-id",
  "automatedResultsUrl": "https://example.invalid/test-results",
  "smokeResult": "passed",
  "securityReviewResult": "passed",
  "accessibilityResult": "passed",
  "qualityGateDecision": "passed",
  "notes": "Required quality gates passed."
}
```

## Release Routing

- `qualityGateDecision = "passed"`: create release approval task.
- `qualityGateDecision = "failed"`: block release and route to remediation.
- `qualityGateDecision = "waived"`: create release approval only with waiver
  reason and failed gate evidence.
- `qualityGateDecision = "pending"`: keep the process waiting.
