# Test Cloud Quality Gate Mapping

This is the Checkpoint 4 Test Manager/Test Cloud mapping for Customer360
release quality gates. The Test Manager project, test cases, and test set are
live; execution evidence remains local/CI mapped because no live Test Cloud
execution was approved or started.

## Verified Context

| Field | Value |
|---|---|
| Organization | `galacticus` |
| Tenant | `DefaultTenant` |
| Folder | `AgentFactoryDemo` |
| Folder key | `cba41e19-47cc-4a0a-bf73-de88b60a61be` |
| Folder id | `7986306` |
| Test Manager project | `Agent Factory Quality Gates` |
| Project key | `AFQG` |
| Project id | `2760d770-7e82-0000-66f7-0b49d3053e3f` |
| Test set | `Customer360 Release Gate` / `AFQG:1` |
| Test set id | `66cdd3ea-c873-0200-58fb-0b49d305588a` |
| Live execution status | Not run |

## Gate Model

Quality gates run after build completion and before release approval. Test
Manager stores the gate catalog; local or CI commands provide hard evidence
until UiPath automation entry points are linked and an approved live run is
started.

| Gate | Live Test Case | Evidence source | Required for demo | Failure behavior |
|---|---|---|---|---|
| Workspace smoke | `AFQG:2` | `npm run smoke` or scoped equivalent | Yes | Block release |
| Metric correctness | `AFQG:7` | Customer360 metrics tests | Yes | Block release |
| PII masking | `AFQG:3` | Customer360 template tests and governance checklist | Yes | Block release unless release approver waives |
| Generated dashboard build | `AFQG:8` | Customer360 template build | Yes | Block release |
| Build worker manifest validation | `AFQG:4` | Build worker tests/smoke | Yes | Block release |
| Release approval evidence | `AFQG:6` | Action Center release approval payload review | Yes | Block release |
| Failed gate deployment block | `AFQG:5` | Maestro/Data Service routing review | Yes | Block release unless explicit waiver route is approved |

## Live Test Manager Structure

| Artifact | Live key/id | Name |
|---|---|---|
| Project | `AFQG` / `2760d770-7e82-0000-66f7-0b49d3053e3f` | `Agent Factory Quality Gates` |
| Test set | `AFQG:1` / `66cdd3ea-c873-0200-58fb-0b49d305588a` | `Customer360 Release Gate` |
| Test case | `AFQG:2` | `AF-QG-001 Workspace smoke passes` |
| Test case | `AFQG:7` | `AF-QG-002 Metric correctness checks pass` |
| Test case | `AFQG:3` | `AF-QG-003 PII masking guardrails pass` |
| Test case | `AFQG:8` | `AF-QG-004 Generated dashboard builds` |
| Test case | `AFQG:4` | `AF-QG-005 Worker manifest validation passes` |
| Test case | `AFQG:6` | `AF-QG-006 Release approval evidence complete` |
| Test case | `AFQG:5` | `AF-QG-007 Failed gate blocks deployment` |

The project default folder is set to
`cba41e19-47cc-4a0a-bf73-de88b60a61be`. The CLI-created test set currently
lists with `FolderKey: ""`, so folder-scoped execution must be rechecked before
any live run.

## Requirements Status

The CLI did not expose a Test Manager requirements command in UiPath CLI
`1.195.1`; `uip tm requirements --help --output json` returned an unknown
command validation error. Requirement coverage is therefore represented by the
gate IDs, test case descriptions, and release-routing contracts in this repo
until requirement objects are created through an approved portal, API, or future
CLI path.

## TestRun Data Service Mapping

Each quality gate execution writes or updates `TestRun`:

| Field | Source |
|---|---|
| `testRunId` | Maestro or API Workflow generated id |
| `requestId` | `AutomationRequest.requestId` |
| `buildRunId` | `BuildRun.buildRunId` |
| `status` | Overall test execution status |
| `testManagerProjectId` | `2760d770-7e82-0000-66f7-0b49d3053e3f` |
| `testSetId` | `66cdd3ea-c873-0200-58fb-0b49d305588a` |
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

1. Test Manager project and test set exist. Complete for project/test
   catalog; live execution not run.
2. One build run creates a `TestRun` record. Pending cross-lane integration
   with Maestro/Data Service/API Workflow.
3. Release approval payload includes quality evidence. Contract documented;
   Action Center lane must include these fields.
4. A failed gate blocks deployment. Contract documented; Maestro/Data Service
   lane must enforce this route.
5. Waived gates require explicit release approval notes. Contract documented;
   Action Center and Maestro lanes must preserve waiver evidence.

## Safe Verification Commands

```bash
uip login status --output json
uip tm testcases --help --output json
uip tm project list --limit 5 --output json
uip tm testcases list --project-key AFQG --output json
uip tm testsets list --project-key AFQG --output json
uip tm testsets list-testcases --project-key AFQG --test-set-key AFQG:1 --output json
uip or folders get AgentFactoryDemo --output json
npm --workspace @agent-factory/customer360-metrics test
npm --workspace @agent-factory/customer360-template run build
npm --workspace @agent-factory/customer360-template test
npm --workspace @agent-factory/build-worker test
npm run smoke
```

Do not run live Test Manager/Test Cloud executions until the automation assets,
folder binding behavior, expected side effects, and TestRun evidence destination
are clear and approved.
