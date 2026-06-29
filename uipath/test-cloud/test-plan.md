# Test Manager And Test Cloud Plan

Status: Test Manager assets live; no live Test Cloud executions have been run.

Verified on 2026-06-29 with UiPath CLI `1.195.1` in `galacticus /
DefaultTenant`.

## Live Project

- Project: `Agent Factory Quality Gates`
- Project key: `AFQG`
- Project id: `2760d770-7e82-0000-66f7-0b49d3053e3f`
- Test set: `Customer360 Release Gate`
- Test set key: `AFQG:1`
- Test set id: `66cdd3ea-c873-0200-58fb-0b49d305588a`
- Folder: `AgentFactoryDemo`
- Folder key: `cba41e19-47cc-4a0a-bf73-de88b60a61be`
- Folder id: `7986306`
- Project default folder: set to `cba41e19-47cc-4a0a-bf73-de88b60a61be`
- Test set folder note: `uip tm testsets list --project-key AFQG` reports an
  empty `FolderKey` for `AFQG:1`; the project default folder is set, but the
  CLI-created test set does not expose folder metadata before execution or
  automation linkage.

## Quality Gates

| ID | Live Test Case | Evidence Source | Required |
|---|---|---|---|
| `AF-QG-001` | `AFQG:2` Workspace smoke passes | `npm run smoke` | Yes |
| `AF-QG-002` | `AFQG:7` Metric correctness checks pass | `npm --workspace @agent-factory/customer360-metrics test` | Yes |
| `AF-QG-003` | `AFQG:3` PII masking guardrails pass | `npm --workspace @agent-factory/customer360-template test` | Yes |
| `AF-QG-004` | `AFQG:8` Generated dashboard builds | `npm --workspace @agent-factory/customer360-template run build` | Yes |
| `AF-QG-005` | `AFQG:4` Worker manifest validation passes | `npm --workspace @agent-factory/build-worker test` | Yes |
| `AF-QG-006` | `AFQG:6` Release approval evidence complete | Action Center release approval payload review | Yes |
| `AF-QG-007` | `AFQG:5` Failed gate blocks deployment | Maestro/Data Service release routing review | Yes |

The Test Manager suite is live and ready to receive execution evidence. The
local and CI commands remain the hard evidence source until approved automation
entry points are linked to the Test Manager cases.

## Test Manager Requirements Status

The target requirements are represented by the quality gate IDs and test case
descriptions above. UiPath CLI `1.195.1` did not expose a Test Manager
`requirements` command; `uip tm --help` listed project, testcases, testsets,
executions, result, report, and related object commands only. Do not claim live
Test Manager requirement objects until they are created through a supported
portal, API, or future CLI flow.

## Data Service Result Shape

```json
{
  "testRunId": "test_req_123_001",
  "requestId": "req_123",
  "buildRunId": "build_req_123_001",
  "status": "passed",
  "testManagerProjectId": "2760d770-7e82-0000-66f7-0b49d3053e3f",
  "testSetId": "66cdd3ea-c873-0200-58fb-0b49d305588a",
  "automatedResultsUrl": "local://npm-run-smoke-or-ci-artifact-url",
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

## Execution Policy

Do not run `uip tm testsets run`, `uip tm testcases run`, or equivalent live
execution commands until the target automation entry points, Test Manager
folder binding behavior, expected side effects, and evidence destination are
approved.
